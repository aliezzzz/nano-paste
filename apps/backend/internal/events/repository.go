package events

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
)

type StoredEvent struct {
	ID        int64           `json:"id"`
	UserID    string          `json:"user_id"`
	EventType string          `json:"event_type"`
	ItemID    *string         `json:"item_id,omitempty"`
	FileID    *string         `json:"file_id,omitempty"`
	Payload   json.RawMessage `json:"payload"`
	CreatedAt string          `json:"created_at"`
}

type repository struct {
	db *sql.DB
}

func newRepository(db *sql.DB) *repository {
	return &repository{db: db}
}

func (r *repository) ListEvents(ctx context.Context, userID string, sinceEventID int64, limit int) ([]StoredEvent, error) {
	const q = `
		SELECT id, user_id, event_type, item_id, file_id, COALESCE(payload_json, '{}') AS payload_json, created_at
		FROM events
		WHERE user_id = ? AND id > ?
		ORDER BY id ASC
		LIMIT ?`

	rows, err := r.db.QueryContext(ctx, q, userID, sinceEventID, limit)
	if err != nil {
		return nil, fmt.Errorf("list events: %w", err)
	}
	defer rows.Close()

	out := make([]StoredEvent, 0, limit)
	for rows.Next() {
		var ev StoredEvent
		var itemID sql.NullString
		var fileID sql.NullString
		var payloadText string
		if err = rows.Scan(&ev.ID, &ev.UserID, &ev.EventType, &itemID, &fileID, &payloadText, &ev.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan event: %w", err)
		}
		if itemID.Valid {
			v := itemID.String
			ev.ItemID = &v
		}
		if fileID.Valid {
			v := fileID.String
			ev.FileID = &v
		}
		ev.Payload = json.RawMessage(payloadText)
		if len(ev.Payload) == 0 {
			ev.Payload = json.RawMessage("{}")
		}
		out = append(out, ev)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate events rows: %w", err)
	}

	return out, nil
}

func (r *repository) LastCursor(ctx context.Context, userID, deviceID string) (int64, error) {
	const q = `SELECT last_event_id FROM sync_cursors WHERE user_id = ? AND device_id = ? LIMIT 1`
	var lastID int64
	err := r.db.QueryRowContext(ctx, q, userID, deviceID).Scan(&lastID)
	if err == sql.ErrNoRows {
		return 0, nil
	}
	if err != nil {
		return 0, fmt.Errorf("get sync cursor: %w", err)
	}
	return lastID, nil
}

func (r *repository) UpsertCursor(ctx context.Context, userID, deviceID string, lastEventID int64) error {
	const q = `
		INSERT INTO sync_cursors(user_id, device_id, last_event_id, updated_at)
		VALUES(?, ?, ?, datetime('now'))
		ON CONFLICT(user_id, device_id)
		DO UPDATE SET last_event_id = excluded.last_event_id, updated_at = datetime('now')`

	if _, err := r.db.ExecContext(ctx, q, userID, deviceID, lastEventID); err != nil {
		return fmt.Errorf("upsert sync cursor: %w", err)
	}
	return nil
}
