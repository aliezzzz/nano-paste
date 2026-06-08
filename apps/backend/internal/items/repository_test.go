package items

import (
	"context"
	"database/sql"
	"testing"

	_ "github.com/mattn/go-sqlite3"
)

func TestCreateTextItemStoresNormalizedTags(t *testing.T) {
	db := openItemsTestDB(t)
	repo := newRepository(db)
	ctx := context.Background()

	item, err := repo.createTextItem(ctx, "u-1", "title", "content", "evt-1", []string{" 工作 ", "", "会议", "工作"})
	if err != nil {
		t.Fatalf("createTextItem: %v", err)
	}

	if len(item.Tags) != 2 || item.Tags[0] != "工作" || item.Tags[1] != "会议" {
		t.Fatalf("unexpected created tags: %#v", item.Tags)
	}

	items, _, err := repo.listItems(ctx, "u-1", "", "", 20, 0)
	if err != nil {
		t.Fatalf("listItems: %v", err)
	}
	if len(items) != 1 {
		t.Fatalf("expected one item, got %d", len(items))
	}
	if len(items[0].Tags) != 2 || items[0].Tags[0] != "工作" || items[0].Tags[1] != "会议" {
		t.Fatalf("unexpected listed tags: %#v", items[0].Tags)
	}
}

func openItemsTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := sql.Open("sqlite3", "file::memory:?cache=shared")
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	stmts := []string{
		`PRAGMA foreign_keys = ON;`,
		`CREATE TABLE file_objects (
		  id TEXT PRIMARY KEY,
		  user_id TEXT NOT NULL,
		  file_name TEXT NOT NULL,
		  file_size INTEGER NOT NULL,
		  mime_type TEXT,
		  status TEXT NOT NULL DEFAULT 'pending',
		  category TEXT NOT NULL DEFAULT 'other',
		  retention_until TEXT NOT NULL,
		  created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);`,
		`CREATE TABLE clipboard_items (
		  id TEXT PRIMARY KEY,
		  user_id TEXT NOT NULL,
		  type TEXT NOT NULL,
		  title TEXT,
		  content TEXT,
		  file_id TEXT,
		  is_favorite INTEGER NOT NULL DEFAULT 0,
		  tags_json TEXT,
		  created_at TEXT NOT NULL,
		  deleted_at TEXT,
		  CHECK (type IN ('text', 'file'))
		);`,
	}

	for _, stmt := range stmts {
		if _, err = db.Exec(stmt); err != nil {
			_ = db.Close()
			t.Fatalf("init test schema: %v", err)
		}
	}

	t.Cleanup(func() { _ = db.Close() })
	return db
}
