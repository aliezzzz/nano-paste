package devices

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

var errDeviceNotFound = errors.New("device not found")

type repository struct {
	db *sql.DB
}

type deviceRow struct {
	ID         string
	DeviceName string
	Platform   string
	ClientVer  string
	LastSeenAt string
	CreatedAt  string
	RevokedAt  sql.NullString
}

func newRepository(db *sql.DB) *repository {
	return &repository{db: db}
}

func (r *repository) registerDevice(ctx context.Context, userID, deviceName, platform, clientVersion string) (deviceRow, error) {
	deviceName = strings.TrimSpace(deviceName)
	platform = strings.TrimSpace(platform)
	clientVersion = strings.TrimSpace(clientVersion)
	if deviceName == "" {
		deviceName = "unknown-device"
	}
	if platform == "" {
		platform = "unknown"
	}

	const findQ = `
		SELECT id
		FROM devices
		WHERE user_id = ? AND device_name = ? AND platform = ? AND revoked_at IS NULL
		ORDER BY created_at DESC
		LIMIT 1`

	var deviceID string
	err := r.db.QueryRowContext(ctx, findQ, userID, deviceName, platform).Scan(&deviceID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return deviceRow{}, fmt.Errorf("find device by scope: %w", err)
	}

	now := time.Now().UTC().Format(time.RFC3339Nano)
	if errors.Is(err, sql.ErrNoRows) {
		deviceID = uuid.NewString()
		const insertQ = `
			INSERT INTO devices(id, user_id, device_name, platform, client_version, last_seen_at, created_at)
			VALUES(?, ?, ?, ?, ?, ?, ?)`
		if _, err = r.db.ExecContext(ctx, insertQ,
			deviceID,
			userID,
			deviceName,
			platform,
			nullIfEmpty(clientVersion),
			now,
			now,
		); err != nil {
			return deviceRow{}, fmt.Errorf("insert device: %w", err)
		}
	} else {
		const updateQ = `
			UPDATE devices
			SET client_version = ?, last_seen_at = ?
			WHERE user_id = ? AND id = ? AND revoked_at IS NULL`
		res, execErr := r.db.ExecContext(ctx, updateQ, nullIfEmpty(clientVersion), now, userID, deviceID)
		if execErr != nil {
			return deviceRow{}, fmt.Errorf("update device by scope: %w", execErr)
		}
		affected, afErr := res.RowsAffected()
		if afErr != nil {
			return deviceRow{}, fmt.Errorf("update device rows affected: %w", afErr)
		}
		if affected == 0 {
			return deviceRow{}, errDeviceNotFound
		}
	}

	return r.getDeviceByID(ctx, userID, deviceID)
}

func (r *repository) heartbeat(ctx context.Context, userID, deviceID string) (string, error) {
	now := time.Now().UTC().Format(time.RFC3339Nano)
	const q = `
		UPDATE devices
		SET last_seen_at = ?
		WHERE user_id = ? AND id = ? AND revoked_at IS NULL`
	res, err := r.db.ExecContext(ctx, q, now, userID, deviceID)
	if err != nil {
		return "", fmt.Errorf("update heartbeat: %w", err)
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return "", fmt.Errorf("heartbeat rows affected: %w", err)
	}
	if affected == 0 {
		return "", errDeviceNotFound
	}
	return now, nil
}

func (r *repository) listDevices(ctx context.Context, userID string) ([]deviceRow, error) {
	const q = `
		SELECT id, device_name, platform, COALESCE(client_version, ''), last_seen_at, created_at, revoked_at
		FROM devices
		WHERE user_id = ?
		ORDER BY datetime(created_at) DESC, id DESC`

	rows, err := r.db.QueryContext(ctx, q, userID)
	if err != nil {
		return nil, fmt.Errorf("list devices: %w", err)
	}
	defer rows.Close()

	out := make([]deviceRow, 0)
	for rows.Next() {
		var d deviceRow
		if err = rows.Scan(&d.ID, &d.DeviceName, &d.Platform, &d.ClientVer, &d.LastSeenAt, &d.CreatedAt, &d.RevokedAt); err != nil {
			return nil, fmt.Errorf("scan device row: %w", err)
		}
		out = append(out, d)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate device rows: %w", err)
	}

	return out, nil
}

func (r *repository) revokeDevice(ctx context.Context, userID, deviceID string) (string, error) {
	revokedAt := time.Now().UTC().Format(time.RFC3339Nano)

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return "", fmt.Errorf("begin revoke device tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	const revokeDeviceQ = `
		UPDATE devices
		SET revoked_at = ?
		WHERE user_id = ? AND id = ? AND revoked_at IS NULL`
	res, err := tx.ExecContext(ctx, revokeDeviceQ, revokedAt, userID, deviceID)
	if err != nil {
		return "", fmt.Errorf("revoke device: %w", err)
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return "", fmt.Errorf("revoke device rows affected: %w", err)
	}
	if affected == 0 {
		return "", errDeviceNotFound
	}

	const revokeSessionQ = `
		UPDATE sessions
		SET revoked_at = ?
		WHERE user_id = ? AND device_id = ? AND revoked_at IS NULL`
	if _, err = tx.ExecContext(ctx, revokeSessionQ, revokedAt, userID, deviceID); err != nil {
		return "", fmt.Errorf("revoke sessions by device: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return "", fmt.Errorf("commit revoke device tx: %w", err)
	}

	return revokedAt, nil
}

func (r *repository) getDeviceByID(ctx context.Context, userID, deviceID string) (deviceRow, error) {
	const q = `
		SELECT id, device_name, platform, COALESCE(client_version, ''), last_seen_at, created_at, revoked_at
		FROM devices
		WHERE user_id = ? AND id = ?
		LIMIT 1`

	var d deviceRow
	if err := r.db.QueryRowContext(ctx, q, userID, deviceID).Scan(
		&d.ID,
		&d.DeviceName,
		&d.Platform,
		&d.ClientVer,
		&d.LastSeenAt,
		&d.CreatedAt,
		&d.RevokedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return deviceRow{}, errDeviceNotFound
		}
		return deviceRow{}, fmt.Errorf("get device by id: %w", err)
	}

	return d, nil
}

func nullIfEmpty(s string) any {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return s
}
