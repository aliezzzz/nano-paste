package auth

import (
	"context"
	"database/sql"
	"testing"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

func TestCreateSession_StoresActiveSession(t *testing.T) {
	db := openTestDB(t)
	repo := newRepository(db)
	ctx := context.Background()

	const userID = "u-1"
	if _, err := db.ExecContext(ctx, `INSERT INTO users(id, account, password_hash) VALUES(?, ?, ?)`, userID, "tester", "hash"); err != nil {
		t.Fatalf("insert user: %v", err)
	}

	accessExp := time.Now().UTC().Add(1 * time.Hour)
	refreshExp := time.Now().UTC().Add(24 * time.Hour)
	refreshToken := "refresh-token-1"

	sessionID, err := repo.createSession(ctx, userID, refreshToken, accessExp, refreshExp)
	if err != nil {
		t.Fatalf("createSession: %v", err)
	}

	session, err := repo.findActiveSessionByRefreshToken(ctx, refreshToken)
	if err != nil {
		t.Fatalf("findActiveSessionByRefreshToken: %v", err)
	}
	if session == nil {
		t.Fatal("expected active session, got nil")
	}
	if session.ID != sessionID {
		t.Fatalf("expected session id %s, got %s", sessionID, session.ID)
	}
	if session.UserID != userID {
		t.Fatalf("expected user id %s, got %s", userID, session.UserID)
	}
}

func openTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := sql.Open("sqlite3", "file::memory:?cache=shared")
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	stmts := []string{
		`PRAGMA foreign_keys = ON;`,
		`CREATE TABLE users (
			id TEXT PRIMARY KEY,
			account TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		);`,
		`CREATE TABLE sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			refresh_token TEXT NOT NULL UNIQUE,
			access_expires_at TEXT,
			refresh_expires_at TEXT,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			revoked_at TEXT,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
	}

	for _, stmt := range stmts {
		if _, err = db.Exec(stmt); err != nil {
			_ = db.Close()
			t.Fatalf("init test schema: %v", err)
		}
	}

	t.Cleanup(func() {
		_ = db.Close()
	})

	return db
}
