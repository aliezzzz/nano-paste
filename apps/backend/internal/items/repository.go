package items

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

var errItemNotFound = errors.New("item not found")

type itemRecord struct {
	ID                string
	UserID            string
	Type              string
	Title             string
	Content           string
	FileID            string
	FileName          string
	FileSize          int64
	MimeType          string
	CreatedByDeviceID string
	CreatedAt         string
	DeletedAt         string
}

type repository struct {
	db *sql.DB
}

func newRepository(db *sql.DB) *repository {
	return &repository{db: db}
}

func (r *repository) createTextItem(ctx context.Context, userID, deviceID, title, content, clientEventID string) (itemRecord, eventRow, error) {
	if strings.TrimSpace(content) == "" {
		return itemRecord{}, eventRow{}, fmt.Errorf("content required")
	}

	itemID := uuid.NewString()
	if strings.TrimSpace(clientEventID) != "" {
		itemID = uuid.NewSHA1(uuid.NameSpaceURL, []byte(userID+":"+strings.TrimSpace(clientEventID))).String()
	}

	now := time.Now().UTC().Format(time.RFC3339Nano)

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return itemRecord{}, eventRow{}, fmt.Errorf("begin tx create item: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	insertQ := `
		INSERT INTO clipboard_items(id, user_id, type, title, content, file_id, created_by_device_id, created_at)
		VALUES(?, ?, 'text', ?, ?, NULL, ?, ?)`
	if _, err = tx.ExecContext(ctx, insertQ, itemID, userID, nullIfEmpty(title), content, nullIfEmpty(deviceID), now); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique") && strings.TrimSpace(clientEventID) != "" {
			existing, existingErr := queryItemByID(ctx, tx, userID, itemID)
			if existingErr != nil {
				return itemRecord{}, eventRow{}, existingErr
			}
			ev, evErr := queryFirstCreateEventByItemID(ctx, tx, userID, itemID)
			if evErr != nil {
				return itemRecord{}, eventRow{}, evErr
			}
			if err = tx.Commit(); err != nil {
				return itemRecord{}, eventRow{}, fmt.Errorf("commit duplicate create item tx: %w", err)
			}
			return existing, ev, nil
		}
		return itemRecord{}, eventRow{}, fmt.Errorf("insert item: %w", err)
	}

	payloadBytes, err := json.Marshal(map[string]any{
		"itemId":    itemID,
		"type":      "text",
		"createdAt": now,
	})
	if err != nil {
		return itemRecord{}, eventRow{}, fmt.Errorf("marshal create event payload: %w", err)
	}

	ev, err := insertEvent(ctx, tx, userID, "item_created", &itemID, nil, string(payloadBytes), now)
	if err != nil {
		return itemRecord{}, eventRow{}, err
	}

	created, err := queryItemByID(ctx, tx, userID, itemID)
	if err != nil {
		return itemRecord{}, eventRow{}, err
	}

	if err = tx.Commit(); err != nil {
		return itemRecord{}, eventRow{}, fmt.Errorf("commit create item tx: %w", err)
	}

	return created, ev, nil
}

func (r *repository) listItems(ctx context.Context, userID, itemType string, limit, offset int) ([]itemRecord, bool, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	query := `
		SELECT i.id, i.user_id, i.type, COALESCE(i.title, ''), COALESCE(i.content, ''), COALESCE(i.file_id, ''),
		       COALESCE(f.file_name, ''), COALESCE(f.file_size, 0), COALESCE(f.mime_type, ''),
		       COALESCE(i.created_by_device_id, ''), i.created_at, COALESCE(i.deleted_at, '')
		FROM clipboard_items i
		LEFT JOIN file_objects f ON f.id = i.file_id
		WHERE i.user_id = ? AND i.deleted_at IS NULL`
	args := []any{userID}
	if itemType == "text" || itemType == "file" {
		query += ` AND i.type = ?`
		args = append(args, itemType)
	}
	query += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`
	args = append(args, limit+1, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, false, fmt.Errorf("list items: %w", err)
	}
	defer rows.Close()

	items := make([]itemRecord, 0, limit+1)
	for rows.Next() {
		it, scanErr := scanItemRow(rows)
		if scanErr != nil {
			return nil, false, scanErr
		}
		items = append(items, it)
	}
	if err = rows.Err(); err != nil {
		return nil, false, fmt.Errorf("iterate items rows: %w", err)
	}

	hasMore := len(items) > limit
	if hasMore {
		items = items[:limit]
	}

	return items, hasMore, nil
}

func (r *repository) getItemByID(ctx context.Context, userID, itemID string) (itemRecord, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT i.id, i.user_id, i.type, COALESCE(i.title, ''), COALESCE(i.content, ''), COALESCE(i.file_id, ''),
		       COALESCE(f.file_name, ''), COALESCE(f.file_size, 0), COALESCE(f.mime_type, ''),
		       COALESCE(i.created_by_device_id, ''), i.created_at, COALESCE(i.deleted_at, '')
		FROM clipboard_items i
		LEFT JOIN file_objects f ON f.id = i.file_id
		WHERE i.user_id = ? AND i.id = ? AND i.deleted_at IS NULL
		LIMIT 1`,
		userID, itemID,
	)

	it, err := scanItemOne(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return itemRecord{}, errItemNotFound
		}
		return itemRecord{}, fmt.Errorf("get item by id: %w", err)
	}
	return it, nil
}

func (r *repository) deleteItem(ctx context.Context, userID, itemID string) (string, eventRow, error) {
	now := time.Now().UTC().Format(time.RFC3339Nano)

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return "", eventRow{}, fmt.Errorf("begin tx delete item: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	res, err := tx.ExecContext(ctx, `
		UPDATE clipboard_items
		SET deleted_at = ?
		WHERE user_id = ? AND id = ? AND deleted_at IS NULL`, now, userID, itemID)
	if err != nil {
		return "", eventRow{}, fmt.Errorf("delete item: %w", err)
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return "", eventRow{}, fmt.Errorf("delete item rows affected: %w", err)
	}
	if affected == 0 {
		return "", eventRow{}, errItemNotFound
	}

	payloadBytes, err := json.Marshal(map[string]any{
		"itemId":    itemID,
		"deletedAt": now,
	})
	if err != nil {
		return "", eventRow{}, fmt.Errorf("marshal delete event payload: %w", err)
	}

	ev, err := insertEvent(ctx, tx, userID, "item_deleted", &itemID, nil, string(payloadBytes), now)
	if err != nil {
		return "", eventRow{}, err
	}

	if err = tx.Commit(); err != nil {
		return "", eventRow{}, fmt.Errorf("commit delete item tx: %w", err)
	}

	return now, ev, nil
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

func insertEvent(ctx context.Context, tx *sql.Tx, userID, eventType string, itemID *string, fileID *string, payloadJSON string, createdAt string) (eventRow, error) {
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

func queryItemByID(ctx context.Context, q queryable, userID, itemID string) (itemRecord, error) {
	row := q.QueryRowContext(ctx, `
		SELECT i.id, i.user_id, i.type, COALESCE(i.title, ''), COALESCE(i.content, ''), COALESCE(i.file_id, ''),
		       COALESCE(f.file_name, ''), COALESCE(f.file_size, 0), COALESCE(f.mime_type, ''),
		       COALESCE(i.created_by_device_id, ''), i.created_at, COALESCE(i.deleted_at, '')
		FROM clipboard_items i
		LEFT JOIN file_objects f ON f.id = i.file_id
		WHERE i.user_id = ? AND i.id = ?
		LIMIT 1`,
		userID, itemID,
	)

	it, err := scanItemOne(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return itemRecord{}, errItemNotFound
		}
		return itemRecord{}, fmt.Errorf("query item by id: %w", err)
	}
	return it, nil
}

func queryFirstCreateEventByItemID(ctx context.Context, tx *sql.Tx, userID, itemID string) (eventRow, error) {
	row := tx.QueryRowContext(ctx, `
		SELECT id, user_id, event_type, item_id, file_id, COALESCE(payload_json, '{}'), created_at
		FROM events
		WHERE user_id = ? AND event_type = 'item_created' AND item_id = ?
		ORDER BY id ASC
		LIMIT 1`, userID, itemID)

	var ev eventRow
	var item sql.NullString
	var file sql.NullString
	if err := row.Scan(&ev.ID, &ev.UserID, &ev.EventType, &item, &file, &ev.Payload, &ev.CreatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return eventRow{}, nil
		}
		return eventRow{}, fmt.Errorf("query first create event by item id: %w", err)
	}
	if item.Valid {
		v := item.String
		ev.ItemID = &v
	}
	if file.Valid {
		v := file.String
		ev.FileID = &v
	}
	return ev, nil
}

type scanner interface {
	Scan(dest ...any) error
}

type queryable interface {
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

func scanItemOne(row scanner) (itemRecord, error) {
	var it itemRecord
	if err := row.Scan(
		&it.ID,
		&it.UserID,
		&it.Type,
		&it.Title,
		&it.Content,
		&it.FileID,
		&it.FileName,
		&it.FileSize,
		&it.MimeType,
		&it.CreatedByDeviceID,
		&it.CreatedAt,
		&it.DeletedAt,
	); err != nil {
		return itemRecord{}, err
	}
	if strings.TrimSpace(it.CreatedByDeviceID) == "" {
		it.CreatedByDeviceID = "device_unknown"
	}
	return it, nil
}

func scanItemRow(rows *sql.Rows) (itemRecord, error) {
	return scanItemOne(rows)
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
