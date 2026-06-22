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

	item, err := repo.createTextItem(ctx, "u-1", "title", "content", "evt-1", []string{" 工作 ", "", "会议", "工作"}, "")
	if err != nil {
		t.Fatalf("createTextItem: %v", err)
	}

	if len(item.Tags) != 2 || item.Tags[0] != "工作" || item.Tags[1] != "会议" {
		t.Fatalf("unexpected created tags: %#v", item.Tags)
	}

	items, _, err := repo.listItems(ctx, "u-1", "", "", "", 20, 0)
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

func TestCreateTextItemWithTopic(t *testing.T) {
	db := openItemsTestDB(t)
	repo := newRepository(db)
	ctx := context.Background()

	item, err := repo.createTextItem(ctx, "u-1", "title", "content", "evt-1", nil, "工作笔记")
	if err != nil {
		t.Fatalf("createTextItem: %v", err)
	}
	if item.Topic != "工作笔记" {
		t.Fatalf("expected topic '工作笔记', got %q", item.Topic)
	}

	fetched, err := repo.getItemByID(ctx, "u-1", item.ID)
	if err != nil {
		t.Fatalf("getItemByID: %v", err)
	}
	if fetched.Topic != "工作笔记" {
		t.Fatalf("expected topic '工作笔记', got %q", fetched.Topic)
	}

	items, _, err := repo.listItems(ctx, "u-1", "", "", "工作笔记", 20, 0)
	if err != nil {
		t.Fatalf("listItems: %v", err)
	}
	if len(items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(items))
	}
	if items[0].Topic != "工作笔记" {
		t.Fatalf("expected topic '工作笔记', got %q", items[0].Topic)
	}
}

func TestSetItemTopic(t *testing.T) {
	db := openItemsTestDB(t)
	repo := newRepository(db)
	ctx := context.Background()

	item, err := repo.createTextItem(ctx, "u-1", "title", "content", "evt-1", nil, "")
	if err != nil {
		t.Fatalf("createTextItem: %v", err)
	}
	if item.Topic != "" {
		t.Fatalf("expected empty topic, got %q", item.Topic)
	}

	updated, err := repo.setItemTopic(ctx, "u-1", item.ID, "学习")
	if err != nil {
		t.Fatalf("setItemTopic: %v", err)
	}
	if updated.Topic != "学习" {
		t.Fatalf("expected topic '学习', got %q", updated.Topic)
	}

	fetched, err := repo.getItemByID(ctx, "u-1", item.ID)
	if err != nil {
		t.Fatalf("getItemByID: %v", err)
	}
	if fetched.Topic != "学习" {
		t.Fatalf("expected topic '学习', got %q", fetched.Topic)
	}

	// Clear topic
	cleared, err := repo.setItemTopic(ctx, "u-1", item.ID, "")
	if err != nil {
		t.Fatalf("setItemTopic clear: %v", err)
	}
	if cleared.Topic != "" {
		t.Fatalf("expected empty topic after clear, got %q", cleared.Topic)
	}
}

func TestListTopics(t *testing.T) {
	db := openItemsTestDB(t)
	repo := newRepository(db)
	ctx := context.Background()

	_, err := repo.createTextItem(ctx, "u-1", "t1", "c1", "evt-1", nil, "工作")
	if err != nil {
		t.Fatalf("createTextItem: %v", err)
	}
	_, err = repo.createTextItem(ctx, "u-1", "t2", "c2", "evt-2", nil, "工作")
	if err != nil {
		t.Fatalf("createTextItem: %v", err)
	}
	_, err = repo.createTextItem(ctx, "u-1", "t3", "c3", "evt-3", nil, "学习")
	if err != nil {
		t.Fatalf("createTextItem: %v", err)
	}
	_, err = repo.createTextItem(ctx, "u-1", "t4", "c4", "evt-4", nil, "")
	if err != nil {
		t.Fatalf("createTextItem: %v", err)
	}

	topics, err := repo.listTopics(ctx, "u-1")
	if err != nil {
		t.Fatalf("listTopics: %v", err)
	}
	if len(topics) != 2 {
		t.Fatalf("expected 2 topics, got %d: %#v", len(topics), topics)
	}
	if topics[0].Name != "工作" || topics[0].Count != 2 {
		t.Fatalf("expected first topic '工作' count 2, got '%s' count %d", topics[0].Name, topics[0].Count)
	}
	if topics[1].Name != "学习" || topics[1].Count != 1 {
		t.Fatalf("expected second topic '学习' count 1, got '%s' count %d", topics[1].Name, topics[1].Count)
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
		  topic TEXT DEFAULT '',
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
