package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"

	_ "github.com/mattn/go-sqlite3"
)

var (
	sqliteOnce sync.Once
	sqliteDB   *sql.DB
	sqliteErr  error
)

func SQLite() (*sql.DB, error) {
	sqliteOnce.Do(func() {
		dsn := os.Getenv("SQLITE_DSN")
		if dsn == "" {
			dsn = "./data/nanopaste.db"
		}

		log.Printf("component=sqlite stage=init event=opening dsn=%s", dsn)

		dir := filepath.Dir(dsn)
		if dir != "." {
			if err := os.MkdirAll(dir, 0o755); err != nil {
				sqliteErr = fmt.Errorf("mkdir sqlite dir: %w", err)
				return
			}
		}

		db, err := sql.Open("sqlite3", dsn)
		if err != nil {
			sqliteErr = fmt.Errorf("open sqlite: %w", err)
			log.Printf("component=sqlite stage=init event=open_failed dsn=%s err=%v", dsn, err)
			return
		}

		if _, err = db.Exec(`PRAGMA foreign_keys = ON;`); err != nil {
			_ = db.Close()
			sqliteErr = fmt.Errorf("enable foreign_keys: %w", err)
			log.Printf("component=sqlite stage=init event=pragma_failed dsn=%s err=%v", dsn, err)
			return
		}
		log.Printf("component=sqlite stage=init event=foreign_keys_enabled")

		if err = ensureAuthTables(db); err != nil {
			_ = db.Close()
			sqliteErr = err
			log.Printf("component=sqlite stage=init event=ensure_auth_tables_failed err=%v", err)
			return
		}

		if err = ensureCoreSyncTables(db); err != nil {
			_ = db.Close()
			sqliteErr = err
			log.Printf("component=sqlite stage=init event=ensure_core_sync_tables_failed err=%v", err)
			return
		}

		sqliteDB = db
		log.Printf("component=sqlite stage=init event=ready dsn=%s", dsn)
	})

	if sqliteErr != nil {
		return nil, sqliteErr
	}
	return sqliteDB, nil
}

func ensureAuthTables(db *sql.DB) error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS users (
		  id TEXT PRIMARY KEY,
		  account TEXT NOT NULL UNIQUE,
		  password_hash TEXT NOT NULL,
		  created_at TEXT NOT NULL DEFAULT (datetime('now')),
		  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		);`,
		`CREATE TABLE IF NOT EXISTS devices (
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
		`CREATE TABLE IF NOT EXISTS sessions (
		  id TEXT PRIMARY KEY,
		  user_id TEXT NOT NULL,
		  device_id TEXT,
		  refresh_token TEXT NOT NULL UNIQUE,
		  access_expires_at TEXT,
		  refresh_expires_at TEXT,
		  created_at TEXT NOT NULL DEFAULT (datetime('now')),
		  revoked_at TEXT,
		  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
		);`,
	}

	for _, stmt := range stmts {
		if _, err := db.Exec(stmt); err != nil {
			return fmt.Errorf("ensure auth tables: %w", err)
		}
	}

	return nil
}

func ensureCoreSyncTables(db *sql.DB) error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS file_objects (
		  id TEXT PRIMARY KEY,
		  user_id TEXT NOT NULL,
		  file_name TEXT NOT NULL,
		  file_size INTEGER NOT NULL,
		  mime_type TEXT,
		  sha256 TEXT,
		  etag TEXT,
		  storage_key TEXT,
		  status TEXT NOT NULL DEFAULT 'pending',
		  category TEXT NOT NULL DEFAULT 'other',
		  retention_until TEXT NOT NULL,
		  ready_at TEXT,
		  cleaned_at TEXT,
		  created_at TEXT NOT NULL DEFAULT (datetime('now')),
		  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS clipboard_items (
		  id TEXT PRIMARY KEY,
		  user_id TEXT NOT NULL,
		  type TEXT NOT NULL,
		  title TEXT,
		  content TEXT,
		  file_id TEXT,
		  is_favorite INTEGER NOT NULL DEFAULT 0,
		  created_by_device_id TEXT,
		  created_at TEXT NOT NULL,
		  deleted_at TEXT,
		  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		  FOREIGN KEY (file_id) REFERENCES file_objects(id) ON DELETE SET NULL,
		  FOREIGN KEY (created_by_device_id) REFERENCES devices(id) ON DELETE SET NULL,
		  CHECK (type IN ('text', 'file'))
		);`,
		`CREATE TABLE IF NOT EXISTS events (
		  id INTEGER PRIMARY KEY AUTOINCREMENT,
		  user_id TEXT NOT NULL,
		  event_type TEXT NOT NULL,
		  item_id TEXT,
		  file_id TEXT,
		  payload_json TEXT,
		  created_at TEXT NOT NULL DEFAULT (datetime('now')),
		  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		  FOREIGN KEY (item_id) REFERENCES clipboard_items(id) ON DELETE SET NULL,
		  FOREIGN KEY (file_id) REFERENCES file_objects(id) ON DELETE SET NULL
		);`,
		`CREATE TABLE IF NOT EXISTS sync_cursors (
		  user_id TEXT NOT NULL,
		  device_id TEXT NOT NULL,
		  last_event_id INTEGER NOT NULL DEFAULT 0,
		  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
		  PRIMARY KEY (user_id, device_id),
		  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
		);`,
		`CREATE INDEX IF NOT EXISTS idx_items_user_created ON clipboard_items(user_id, created_at DESC);`,
		`CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id, id);`,
		`CREATE INDEX IF NOT EXISTS idx_file_objects_retention ON file_objects(retention_until, cleaned_at);`,
		`CREATE INDEX IF NOT EXISTS idx_file_objects_user_category ON file_objects(user_id, category);`,
	}

	for _, stmt := range stmts {
		if _, err := db.Exec(stmt); err != nil {
			return fmt.Errorf("ensure core sync tables: %w", err)
		}
	}

	if err := ensureColumnExists(db, "clipboard_items", "is_favorite", "INTEGER NOT NULL DEFAULT 0"); err != nil {
		return fmt.Errorf("ensure core sync tables: %w", err)
	}

	if _, err := db.Exec(`CREATE INDEX IF NOT EXISTS idx_items_user_favorite_created ON clipboard_items(user_id, is_favorite, created_at DESC);`); err != nil {
		return fmt.Errorf("ensure core sync tables: %w", err)
	}

	return nil
}

func ensureColumnExists(db *sql.DB, tableName, columnName, ddl string) error {
	stmt := fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s %s", tableName, columnName, ddl)
	if _, err := db.Exec(stmt); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate column name") {
			return nil
		}
		return fmt.Errorf("add column %s.%s: %w", tableName, columnName, err)
	}
	return nil
}
