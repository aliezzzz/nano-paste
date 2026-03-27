package files

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

var (
	errFileNotFound = errors.New("file not found")
	errFileNotReady = errors.New("file not ready")
)

type repository struct {
	db *sql.DB
}

func newRepository(db *sql.DB) *repository {
	return &repository{db: db}
}

type prepareUploadInput struct {
	UserID   string
	FileName string
	FileSize int64
	MimeType string
	SHA256   string
	Category string
}

type prepareUploadOutput struct {
	FileID       string
	UploadURL    string
	UploadMethod string
	ExpiresAt    string
	Category     string
}

func (r *repository) prepareUpload(ctx context.Context, in prepareUploadInput) (prepareUploadOutput, error) {
	now := time.Now().UTC()
	fileID := uuid.NewString()
	retentionUntil := now.Add(90 * 24 * time.Hour).Format(time.RFC3339Nano)
	createdAt := now.Format(time.RFC3339Nano)
	storageKey := fmt.Sprintf("mock/%s/%s", in.UserID, fileID)

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO file_objects(
			id, user_id, file_name, file_size, mime_type, sha256, storage_key, status, category, retention_until, created_at
		)
		VALUES(?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
		fileID,
		in.UserID,
		in.FileName,
		in.FileSize,
		nullIfEmpty(in.MimeType),
		nullIfEmpty(in.SHA256),
		storageKey,
		normalizeCategory(in.Category),
		retentionUntil,
		createdAt,
	)
	if err != nil {
		return prepareUploadOutput{}, fmt.Errorf("insert file object: %w", err)
	}

	return prepareUploadOutput{
		FileID:       fileID,
		UploadURL:    mockUploadURL(fileID),
		UploadMethod: "PUT",
		ExpiresAt:    now.Add(24 * time.Hour).Format(time.RFC3339Nano),
		Category:     normalizeCategory(in.Category),
	}, nil
}

type completeUploadInput struct {
	UserID   string
	DeviceID string
	FileID   string
	ETag     string
	SHA256   string
}

type completeUploadOutput struct {
	ItemID    string
	FileID    string
	Category  string
	CreatedAt string
}

type fileObjectRow struct {
	ID       string
	FileName string
	FileSize int64
	MimeType string
	Category string
	Status   string
}

type eventRow struct {
	ID        int64
	UserID    string
	EventType string
	ItemID    *string
	FileID    *string
	Payload   string
	CreatedAt string
}

func (r *repository) completeUpload(ctx context.Context, in completeUploadInput) (completeUploadOutput, eventRow, error) {
	now := time.Now().UTC().Format(time.RFC3339Nano)

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return completeUploadOutput{}, eventRow{}, fmt.Errorf("begin tx complete upload: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	fo, err := queryFileObjectForUpdate(ctx, tx, in.UserID, in.FileID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return completeUploadOutput{}, eventRow{}, errFileNotFound
		}
		return completeUploadOutput{}, eventRow{}, err
	}

	if _, err = tx.ExecContext(ctx, `
		UPDATE file_objects
		SET status = 'ready', etag = COALESCE(?, etag), sha256 = COALESCE(?, sha256), ready_at = ?
		WHERE user_id = ? AND id = ?`,
		nullIfEmpty(in.ETag),
		nullIfEmpty(in.SHA256),
		now,
		in.UserID,
		in.FileID,
	); err != nil {
		return completeUploadOutput{}, eventRow{}, fmt.Errorf("update file object ready: %w", err)
	}

	itemID := uuid.NewString()
	if _, err = tx.ExecContext(ctx, `
		INSERT INTO clipboard_items(id, user_id, type, title, content, file_id, created_by_device_id, created_at)
		VALUES(?, ?, 'file', ?, NULL, ?, ?, ?)`,
		itemID,
		in.UserID,
		nullIfEmpty(fo.FileName),
		in.FileID,
		nullIfEmpty(in.DeviceID),
		now,
	); err != nil {
		return completeUploadOutput{}, eventRow{}, fmt.Errorf("insert file item: %w", err)
	}

	payloadBytes, err := json.Marshal(map[string]any{
		"itemId":   itemID,
		"fileId":   in.FileID,
		"fileName": fo.FileName,
		"fileSize": fo.FileSize,
		"mimeType": emptyAsNil(fo.MimeType),
		"category": normalizeCategory(fo.Category),
		"readyAt":  now,
	})
	if err != nil {
		return completeUploadOutput{}, eventRow{}, fmt.Errorf("marshal file_ready payload: %w", err)
	}

	event, err := insertEvent(ctx, tx, in.UserID, "file_ready", &itemID, &in.FileID, string(payloadBytes), now)
	if err != nil {
		return completeUploadOutput{}, eventRow{}, err
	}

	if err = tx.Commit(); err != nil {
		return completeUploadOutput{}, eventRow{}, fmt.Errorf("commit complete upload tx: %w", err)
	}

	return completeUploadOutput{
		ItemID:    itemID,
		FileID:    in.FileID,
		Category:  normalizeCategory(fo.Category),
		CreatedAt: now,
	}, event, nil
}

type prepareDownloadOutput struct {
	FileID      string
	FileName    string
	FileSize    int64
	DownloadURL string
	ExpiresAt   string
	Category    string
}

func (r *repository) prepareDownload(ctx context.Context, userID, fileID string) (prepareDownloadOutput, error) {
	const q = `
		SELECT id, file_name, file_size, COALESCE(mime_type, ''), COALESCE(category, 'other'), status
		FROM file_objects
		WHERE user_id = ? AND id = ? AND cleaned_at IS NULL
		LIMIT 1`
	var fo fileObjectRow
	if err := r.db.QueryRowContext(ctx, q, userID, fileID).Scan(
		&fo.ID,
		&fo.FileName,
		&fo.FileSize,
		&fo.MimeType,
		&fo.Category,
		&fo.Status,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return prepareDownloadOutput{}, errFileNotFound
		}
		return prepareDownloadOutput{}, fmt.Errorf("query file for download: %w", err)
	}

	if strings.TrimSpace(fo.Status) != "ready" {
		return prepareDownloadOutput{}, errFileNotReady
	}

	return prepareDownloadOutput{
		FileID:      fo.ID,
		FileName:    fo.FileName,
		FileSize:    fo.FileSize,
		DownloadURL: mockDownloadURL(fo.ID),
		ExpiresAt:   time.Now().UTC().Add(24 * time.Hour).Format(time.RFC3339Nano),
		Category:    normalizeCategory(fo.Category),
	}, nil
}

type cleanupInput struct {
	UserID     string
	Reason     string
	ItemIDs    []string
	BeforeTime string
	Category   string
}

type cleanupOutput struct {
	Removed        int
	RemovedFileIDs []string
	CleanedAt      string
}

func (r *repository) cleanupFiles(ctx context.Context, in cleanupInput) (cleanupOutput, []eventRow, error) {
	now := time.Now().UTC().Format(time.RFC3339Nano)

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return cleanupOutput{}, nil, fmt.Errorf("begin tx cleanup files: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	fileIDs, err := queryCleanupTargets(ctx, tx, in)
	if err != nil {
		return cleanupOutput{}, nil, err
	}

	events := make([]eventRow, 0, len(fileIDs))
	for _, fileID := range fileIDs {
		if _, err = tx.ExecContext(ctx, `
			UPDATE file_objects
			SET cleaned_at = ?
			WHERE user_id = ? AND id = ? AND cleaned_at IS NULL`, now, in.UserID, fileID); err != nil {
			return cleanupOutput{}, nil, fmt.Errorf("set file cleaned_at: %w", err)
		}

		if _, err = tx.ExecContext(ctx, `
			UPDATE clipboard_items
			SET deleted_at = ?
			WHERE user_id = ? AND file_id = ? AND deleted_at IS NULL`, now, in.UserID, fileID); err != nil {
			return cleanupOutput{}, nil, fmt.Errorf("set item deleted_at by file_id: %w", err)
		}

		payloadBytes, mErr := json.Marshal(map[string]any{
			"fileId":    fileID,
			"reason":    in.Reason,
			"deletedAt": now,
		})
		if mErr != nil {
			return cleanupOutput{}, nil, fmt.Errorf("marshal file_cleaned payload: %w", mErr)
		}
		ev, insErr := insertEvent(ctx, tx, in.UserID, "file_cleaned", nil, &fileID, string(payloadBytes), now)
		if insErr != nil {
			return cleanupOutput{}, nil, insErr
		}
		events = append(events, ev)
	}

	if err = tx.Commit(); err != nil {
		return cleanupOutput{}, nil, fmt.Errorf("commit cleanup files tx: %w", err)
	}

	return cleanupOutput{
		Removed:        len(fileIDs),
		RemovedFileIDs: fileIDs,
		CleanedAt:      now,
	}, events, nil
}

func queryCleanupTargets(ctx context.Context, tx *sql.Tx, in cleanupInput) ([]string, error) {
	if len(in.ItemIDs) > 0 {
		base := `
			SELECT DISTINCT f.id
			FROM file_objects f
			JOIN clipboard_items i ON i.file_id = f.id AND i.user_id = f.user_id
			WHERE f.user_id = ? AND f.cleaned_at IS NULL AND i.deleted_at IS NULL`
		args := []any{in.UserID}

		if strings.TrimSpace(in.Category) != "" {
			base += ` AND COALESCE(f.category, 'other') = ?`
			args = append(args, normalizeCategory(in.Category))
		}

		base += " AND i.id IN (" + placeholders(len(in.ItemIDs)) + ")"
		for _, itemID := range in.ItemIDs {
			args = append(args, itemID)
		}

		rows, err := tx.QueryContext(ctx, base, args...)
		if err != nil {
			return nil, fmt.Errorf("query cleanup targets by item ids: %w", err)
		}
		defer rows.Close()
		return collectIDs(rows)
	}

	base := `
		SELECT f.id
		FROM file_objects f
		WHERE f.user_id = ? AND f.cleaned_at IS NULL`
	args := []any{in.UserID}

	if strings.TrimSpace(in.BeforeTime) != "" {
		base += ` AND f.created_at <= ?`
		args = append(args, strings.TrimSpace(in.BeforeTime))
	}
	if strings.TrimSpace(in.Category) != "" {
		base += ` AND COALESCE(f.category, 'other') = ?`
		args = append(args, normalizeCategory(in.Category))
	}
	if strings.TrimSpace(in.Reason) == "expired" {
		base += ` AND f.retention_until <= ?`
		args = append(args, time.Now().UTC().Format(time.RFC3339Nano))
	}

	rows, err := tx.QueryContext(ctx, base, args...)
	if err != nil {
		return nil, fmt.Errorf("query cleanup targets by filter: %w", err)
	}
	defer rows.Close()
	return collectIDs(rows)
}

func queryFileObjectForUpdate(ctx context.Context, tx *sql.Tx, userID, fileID string) (fileObjectRow, error) {
	row := tx.QueryRowContext(ctx, `
		SELECT id, file_name, file_size, COALESCE(mime_type, ''), COALESCE(category, 'other'), status
		FROM file_objects
		WHERE user_id = ? AND id = ? AND cleaned_at IS NULL
		LIMIT 1`, userID, fileID)
	var fo fileObjectRow
	if err := row.Scan(&fo.ID, &fo.FileName, &fo.FileSize, &fo.MimeType, &fo.Category, &fo.Status); err != nil {
		return fileObjectRow{}, err
	}
	return fo, nil
}

func insertEvent(ctx context.Context, tx *sql.Tx, userID, eventType string, itemID *string, fileID *string, payloadJSON, createdAt string) (eventRow, error) {
	res, err := tx.ExecContext(ctx, `
		INSERT INTO events(user_id, event_type, item_id, file_id, payload_json, created_at)
		VALUES(?, ?, ?, ?, ?, ?)`,
		userID,
		eventType,
		nullIfNilString(itemID),
		nullIfNilString(fileID),
		payloadJSON,
		createdAt,
	)
	if err != nil {
		return eventRow{}, fmt.Errorf("insert event: %w", err)
	}
	eventID, err := res.LastInsertId()
	if err != nil {
		return eventRow{}, fmt.Errorf("event last insert id: %w", err)
	}

	return eventRow{
		ID:        eventID,
		UserID:    userID,
		EventType: eventType,
		ItemID:    itemID,
		FileID:    fileID,
		Payload:   payloadJSON,
		CreatedAt: createdAt,
	}, nil
}

func normalizeCategory(raw string) string {
	v := strings.TrimSpace(strings.ToLower(raw))
	if v == "" {
		return "other"
	}
	switch v {
	case "image", "video", "audio", "document", "archive", "other":
		return v
	default:
		return "other"
	}
}

func mockUploadURL(fileID string) string {
	return fmt.Sprintf("https://mock.nanopaste.local/upload/%s?sig=placeholder", fileID)
}

func mockDownloadURL(fileID string) string {
	return fmt.Sprintf("https://mock.nanopaste.local/download/%s?sig=placeholder", fileID)
}

func nullIfEmpty(s string) any {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return strings.TrimSpace(s)
}

func nullIfNilString(s *string) any {
	if s == nil || strings.TrimSpace(*s) == "" {
		return nil
	}
	return strings.TrimSpace(*s)
}

func emptyAsNil(s string) any {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return s
}

func placeholders(n int) string {
	if n <= 0 {
		return ""
	}
	chunks := make([]string, n)
	for i := 0; i < n; i++ {
		chunks[i] = "?"
	}
	return strings.Join(chunks, ",")
}

func collectIDs(rows *sql.Rows) ([]string, error) {
	out := make([]string, 0)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("scan id: %w", err)
		}
		out = append(out, id)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate ids rows: %w", err)
	}
	return out, nil
}
