package auth

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type user struct {
	ID           string
	Username     string
	PasswordHash string
}

type session struct {
	ID               string
	UserID           string
	RefreshToken     string
	RefreshExpiresAt sql.NullString
	RevokedAt        sql.NullString
}

type repository struct {
	db *sql.DB
}

func newRepository(db *sql.DB) *repository {
	return &repository{db: db}
}

func (r *repository) findUserByUsername(ctx context.Context, username string) (*user, error) {
	const q = `SELECT id, account, password_hash FROM users WHERE account = ? LIMIT 1`
	row := r.db.QueryRowContext(ctx, q, username)

	var u user
	if err := row.Scan(&u.ID, &u.Username, &u.PasswordHash); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find user by username: %w", err)
	}
	return &u, nil
}

func (r *repository) createUser(ctx context.Context, username, passwordHash string) (*user, error) {
	u := &user{
		ID:           uuid.NewString(),
		Username:     username,
		PasswordHash: passwordHash,
	}

	const q = `INSERT INTO users(id, account, password_hash, updated_at) VALUES(?, ?, ?, datetime('now'))`
	if _, err := r.db.ExecContext(ctx, q, u.ID, u.Username, u.PasswordHash); err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	return u, nil
}

func (r *repository) createSession(ctx context.Context, userID, refreshToken string, accessExp, refreshExp time.Time) (string, error) {
	sessionID := uuid.NewString()
	const q = `
		INSERT INTO sessions(id, user_id, refresh_token, access_expires_at, refresh_expires_at)
		VALUES(?, ?, ?, ?, ?)`
	if _, err := r.db.ExecContext(ctx, q,
		sessionID,
		userID,
		refreshToken,
		accessExp.UTC().Format(time.RFC3339),
		refreshExp.UTC().Format(time.RFC3339),
	); err != nil {
		return "", fmt.Errorf("create session: %w", err)
	}

	return sessionID, nil
}

func (r *repository) findActiveSessionByRefreshToken(ctx context.Context, refreshToken string) (*session, error) {
	const q = `
		SELECT id, user_id, refresh_token, refresh_expires_at, revoked_at
		FROM sessions
		WHERE refresh_token = ?
		LIMIT 1`

	var s session
	if err := r.db.QueryRowContext(ctx, q, refreshToken).
		Scan(&s.ID, &s.UserID, &s.RefreshToken, &s.RefreshExpiresAt, &s.RevokedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find session by refresh token: %w", err)
	}

	if s.RevokedAt.Valid {
		return nil, nil
	}

	if s.RefreshExpiresAt.Valid {
		tm, err := time.Parse(time.RFC3339, strings.TrimSpace(s.RefreshExpiresAt.String))
		if err == nil && time.Now().UTC().After(tm) {
			return nil, nil
		}
	}

	return &s, nil
}

func (r *repository) rotateRefreshToken(ctx context.Context, sessionID, oldToken, newToken string, accessExp, refreshExp time.Time) error {
	const q = `
		UPDATE sessions
		SET refresh_token = ?, access_expires_at = ?, refresh_expires_at = ?
		WHERE id = ? AND refresh_token = ? AND revoked_at IS NULL`

	res, err := r.db.ExecContext(ctx, q,
		newToken,
		accessExp.UTC().Format(time.RFC3339),
		refreshExp.UTC().Format(time.RFC3339),
		sessionID,
		oldToken,
	)
	if err != nil {
		return fmt.Errorf("rotate refresh token: %w", err)
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("rotate refresh token rows affected: %w", err)
	}
	if affected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (r *repository) revokeByRefreshToken(ctx context.Context, refreshToken string) error {
	const q = `
		UPDATE sessions
		SET revoked_at = datetime('now')
		WHERE refresh_token = ? AND revoked_at IS NULL`
	if _, err := r.db.ExecContext(ctx, q, refreshToken); err != nil {
		return fmt.Errorf("revoke by refresh token: %w", err)
	}
	return nil
}

func (r *repository) revokeByUserID(ctx context.Context, userID string) error {
	const q = `
		UPDATE sessions
		SET revoked_at = datetime('now')
		WHERE user_id = ? AND revoked_at IS NULL`
	if _, err := r.db.ExecContext(ctx, q, userID); err != nil {
		return fmt.Errorf("revoke by user id: %w", err)
	}
	return nil
}
