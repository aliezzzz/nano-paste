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
	ID          string
	UserID      string
	Type        string
	Title       string
	Content     string
	FileID      string
	IsFavorite  bool
	FileName    string
	FileSize    int64
	MimeType    string
	Tags        []string
	Topic       string
	ContentKind string
	Language    string
	CreatedAt   string
	DeletedAt   string
}

type repository struct {
	db *sql.DB
}

func newRepository(db *sql.DB) *repository {
	return &repository{db: db}
}

func (r *repository) createTextItem(ctx context.Context, userID, title, content, clientEventID string, tags []string, topic, contentKind, language string) (itemRecord, error) {
	if strings.TrimSpace(content) == "" {
		return itemRecord{}, fmt.Errorf("content required")
	}

	itemID := uuid.NewString()
	if strings.TrimSpace(clientEventID) != "" {
		itemID = uuid.NewSHA1(uuid.NameSpaceURL, []byte(userID+":"+strings.TrimSpace(clientEventID))).String()
	}

	now := time.Now().UTC().Format(time.RFC3339Nano)
	tagsJSON, err := encodeTags(tags)
	if err != nil {
		return itemRecord{}, err
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return itemRecord{}, fmt.Errorf("begin tx create item: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	insertQ := `
		INSERT INTO clipboard_items(id, user_id, type, title, content, file_id, tags_json, topic, content_kind, language, created_at)
		VALUES(?, ?, 'text', ?, ?, NULL, ?, ?, ?, ?, ?)`
	if _, err = tx.ExecContext(ctx, insertQ, itemID, userID, nullIfEmpty(title), content, nullIfEmpty(tagsJSON), nullIfEmpty(topic), normalizeContentKind(contentKind), nullIfEmpty(language), now); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique") && strings.TrimSpace(clientEventID) != "" {
			existing, existingErr := queryItemByID(ctx, tx, userID, itemID)
			if existingErr != nil {
				return itemRecord{}, existingErr
			}
			if err = tx.Commit(); err != nil {
				return itemRecord{}, fmt.Errorf("commit duplicate create item tx: %w", err)
			}
			return existing, nil
		}
		return itemRecord{}, fmt.Errorf("insert item: %w", err)
	}

	created, err := queryItemByID(ctx, tx, userID, itemID)
	if err != nil {
		return itemRecord{}, err
	}

	if err = tx.Commit(); err != nil {
		return itemRecord{}, fmt.Errorf("commit create item tx: %w", err)
	}

	return created, nil
}

func (r *repository) listItems(ctx context.Context, userID, itemType, sort, topic string, limit, offset int) ([]itemRecord, bool, error) {
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
		SELECT i.id, i.user_id, i.type, COALESCE(i.title, ''), COALESCE(i.content, ''), COALESCE(i.file_id, ''), COALESCE(i.is_favorite, 0), COALESCE(i.tags_json, ''),
		       COALESCE(i.topic, ''), COALESCE(i.content_kind, 'text'), COALESCE(i.language, ''),
		       COALESCE(f.file_name, ''), COALESCE(f.file_size, 0), COALESCE(f.mime_type, ''),
		       i.created_at, COALESCE(i.deleted_at, '')
		FROM clipboard_items i
		LEFT JOIN file_objects f ON f.id = i.file_id
		WHERE i.user_id = ? AND i.deleted_at IS NULL`
	args := []any{userID}
	if itemType == "text" || itemType == "file" {
		query += ` AND i.type = ?`
		args = append(args, itemType)
	}
	if strings.TrimSpace(topic) != "" {
		query += ` AND i.topic = ?`
		args = append(args, strings.TrimSpace(topic))
	}
	if strings.TrimSpace(sort) == "favorite" {
		query += ` ORDER BY COALESCE(i.is_favorite, 0) DESC, i.created_at DESC LIMIT ? OFFSET ?`
	} else {
		query += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`
	}
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
		SELECT i.id, i.user_id, i.type, COALESCE(i.title, ''), COALESCE(i.content, ''), COALESCE(i.file_id, ''), COALESCE(i.is_favorite, 0), COALESCE(i.tags_json, ''),
		       COALESCE(i.topic, ''), COALESCE(i.content_kind, 'text'), COALESCE(i.language, ''),
		       COALESCE(f.file_name, ''), COALESCE(f.file_size, 0), COALESCE(f.mime_type, ''),
		       i.created_at, COALESCE(i.deleted_at, '')
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

func (r *repository) setItemFavorite(ctx context.Context, userID, itemID string, favorite bool) (itemRecord, string, error) {
	now := time.Now().UTC().Format(time.RFC3339Nano)

	res, err := r.db.ExecContext(ctx, `
		UPDATE clipboard_items
		SET is_favorite = ?
		WHERE user_id = ? AND id = ? AND deleted_at IS NULL`, boolToInt(favorite), userID, itemID)
	if err != nil {
		return itemRecord{}, "", fmt.Errorf("set item favorite: %w", err)
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return itemRecord{}, "", fmt.Errorf("set item favorite rows affected: %w", err)
	}
	if affected == 0 {
		return itemRecord{}, "", errItemNotFound
	}

	item, err := r.getItemByID(ctx, userID, itemID)
	if err != nil {
		return itemRecord{}, "", err
	}

	return item, now, nil
}

func (r *repository) setItemTopic(ctx context.Context, userID, itemID, topic string) (itemRecord, error) {
	res, err := r.db.ExecContext(ctx, `
		UPDATE clipboard_items
		SET topic = ?
		WHERE user_id = ? AND id = ? AND deleted_at IS NULL`, nullIfEmpty(topic), userID, itemID)
	if err != nil {
		return itemRecord{}, fmt.Errorf("set item topic: %w", err)
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return itemRecord{}, fmt.Errorf("set item topic rows affected: %w", err)
	}
	if affected == 0 {
		return itemRecord{}, errItemNotFound
	}

	item, err := r.getItemByID(ctx, userID, itemID)
	if err != nil {
		return itemRecord{}, err
	}

	return item, nil
}

func (r *repository) deleteItem(ctx context.Context, userID, itemID string) (string, error) {
	now := time.Now().UTC().Format(time.RFC3339Nano)

	res, err := r.db.ExecContext(ctx, `
		UPDATE clipboard_items
		SET deleted_at = ?
		WHERE user_id = ? AND id = ? AND deleted_at IS NULL`, now, userID, itemID)
	if err != nil {
		return "", fmt.Errorf("delete item: %w", err)
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return "", fmt.Errorf("delete item rows affected: %w", err)
	}
	if affected == 0 {
		return "", errItemNotFound
	}

	return now, nil
}

func queryItemByID(ctx context.Context, q queryable, userID, itemID string) (itemRecord, error) {
	row := q.QueryRowContext(ctx, `
		SELECT i.id, i.user_id, i.type, COALESCE(i.title, ''), COALESCE(i.content, ''), COALESCE(i.file_id, ''), COALESCE(i.is_favorite, 0), COALESCE(i.tags_json, ''),
		       COALESCE(i.topic, ''), COALESCE(i.content_kind, 'text'), COALESCE(i.language, ''),
		       COALESCE(f.file_name, ''), COALESCE(f.file_size, 0), COALESCE(f.mime_type, ''),
		       i.created_at, COALESCE(i.deleted_at, '')
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

type scanner interface {
	Scan(dest ...any) error
}

type queryable interface {
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

func scanItemOne(row scanner) (itemRecord, error) {
	var it itemRecord
	var isFavorite int
	var tagsJSON string
	if err := row.Scan(
		&it.ID,
		&it.UserID,
		&it.Type,
		&it.Title,
		&it.Content,
		&it.FileID,
		&isFavorite,
		&tagsJSON,
		&it.Topic,
		&it.ContentKind,
		&it.Language,
		&it.FileName,
		&it.FileSize,
		&it.MimeType,
		&it.CreatedAt,
		&it.DeletedAt,
	); err != nil {
		return itemRecord{}, err
	}
	it.IsFavorite = isFavorite > 0
	it.Tags = decodeTags(tagsJSON)
	it.ContentKind = normalizeContentKind(it.ContentKind)
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

func boolToInt(v bool) int {
	if v {
		return 1
	}
	return 0
}

func normalizeContentKind(kind string) string {
	switch strings.TrimSpace(kind) {
	case "code":
		return "code"
	default:
		return "text"
	}
}

func encodeTags(tags []string) (string, error) {
	normalized := normalizeTags(tags)
	if len(normalized) == 0 {
		return "", nil
	}
	b, err := json.Marshal(normalized)
	if err != nil {
		return "", fmt.Errorf("encode tags: %w", err)
	}
	return string(b), nil
}

func decodeTags(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	var tags []string
	if err := json.Unmarshal([]byte(raw), &tags); err != nil {
		return nil
	}
	return normalizeTags(tags)
}

func normalizeTags(tags []string) []string {
	seen := map[string]bool{}
	out := make([]string, 0, len(tags))
	for _, tag := range tags {
		normalized := strings.TrimSpace(tag)
		if normalized == "" || seen[normalized] {
			continue
		}
		seen[normalized] = true
		out = append(out, normalized)
	}
	return out
}

type topicInfo struct {
	Name  string
	Count int
}

func (r *repository) listTopics(ctx context.Context, userID string) ([]topicInfo, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT topic, COUNT(*) as cnt
		FROM clipboard_items
		WHERE user_id = ? AND deleted_at IS NULL AND topic != ''
		GROUP BY topic
		ORDER BY cnt DESC, topic ASC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("list topics: %w", err)
	}
	defer rows.Close()

	topics := make([]topicInfo, 0)
	for rows.Next() {
		var t topicInfo
		if err := rows.Scan(&t.Name, &t.Count); err != nil {
			return nil, fmt.Errorf("scan topic row: %w", err)
		}
		topics = append(topics, t)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate topics rows: %w", err)
	}

	return topics, nil
}
