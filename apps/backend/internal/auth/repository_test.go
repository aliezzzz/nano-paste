package auth

import (
	"context"
	"database/sql"
	"testing"

	_ "github.com/mattn/go-sqlite3"
)

func TestUpsertDevice_ReusesWebDeviceByScope(t *testing.T) {
	db := openTestDB(t)
	repo := newRepository(db)
	ctx := context.Background()

	const userID = "u-1"
	if _, err := db.ExecContext(ctx, `INSERT INTO users(id, account, password_hash) VALUES(?, ?, ?)`, userID, "tester", "hash"); err != nil {
		t.Fatalf("insert user: %v", err)
	}

	firstID, err := repo.upsertDevice(ctx, userID, "", "web", "windows", "0.1.0")
	if err != nil {
		t.Fatalf("first upsertDevice: %v", err)
	}

	secondID, err := repo.upsertDevice(ctx, userID, "", "web", "windows", "0.1.0")
	if err != nil {
		t.Fatalf("second upsertDevice: %v", err)
	}

	if secondID != firstID {
		t.Fatalf("expected same device id to be reused, got first=%s second=%s", firstID, secondID)
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
		`CREATE TABLE devices (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			device_name TEXT NOT NULL,
			platform TEXT NOT NULL DEFAULT 'unknown',
			client_version TEXT,
			last_seen_at TEXT NOT NULL,
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
