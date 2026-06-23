package items

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ronronner/my-todolist/apps/backend/internal/common"
)

func TestSetItemTopicEndToEnd(t *testing.T) {
	db := openItemsTestDB(t)
	repo := newRepository(db)
	ctx := context.Background()

	item, err := repo.createTextItem(ctx, "u-1", "title", "content", "evt-1", nil, "", "", "")
	if err != nil {
		t.Fatalf("createTextItem: %v", err)
	}

	// Verify item has no topic initially
	fetched, err := repo.getItemByID(ctx, "u-1", item.ID)
	if err != nil {
		t.Fatalf("getItemByID: %v", err)
	}
	if fetched.Topic != "" {
		t.Fatalf("expected empty topic, got %q", fetched.Topic)
	}

	// Set topic
	updated, err := repo.setItemTopic(ctx, "u-1", item.ID, "工作")
	if err != nil {
		t.Fatalf("setItemTopic: %v", err)
	}
	if updated.Topic != "工作" {
		t.Fatalf("expected topic '工作', got %q", updated.Topic)
	}

	// Verify topic is persisted
	fetched, err = repo.getItemByID(ctx, "u-1", item.ID)
	if err != nil {
		t.Fatalf("getItemByID: %v", err)
	}
	if fetched.Topic != "工作" {
		t.Fatalf("expected topic '工作', got %q", fetched.Topic)
	}

	// Verify topic appears in listTopics
	topics, err := repo.listTopics(ctx, "u-1")
	if err != nil {
		t.Fatalf("listTopics: %v", err)
	}
	if len(topics) != 1 || topics[0].Name != "工作" {
		t.Fatalf("expected topics [{工作 1}], got %#v", topics)
	}

	// Verify listItems with topic filter
	items, _, err := repo.listItems(ctx, "u-1", "", "", "工作", 20, 0)
	if err != nil {
		t.Fatalf("listItems: %v", err)
	}
	if len(items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(items))
	}
	if items[0].Topic != "工作" {
		t.Fatalf("expected topic '工作', got %q", items[0].Topic)
	}

	// Change topic
	updated, err = repo.setItemTopic(ctx, "u-1", item.ID, "生活")
	if err != nil {
		t.Fatalf("setItemTopic: %v", err)
	}
	if updated.Topic != "生活" {
		t.Fatalf("expected topic '生活', got %q", updated.Topic)
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

func TestCommonWriteSuccess(t *testing.T) {
	w := httptest.NewRecorder()
	common.WriteSuccess(w, http.StatusOK, map[string]any{
		"success": true,
		"itemId":  "abc",
		"topic":   "工作",
	}, "req-123")

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var resp map[string]any
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if resp["ok"] != true {
		t.Fatalf("expected ok=true, got %v", resp["ok"])
	}

	data, ok := resp["data"].(map[string]any)
	if !ok {
		t.Fatalf("expected data to be a map, got %T", resp["data"])
	}
	if data["success"] != true {
		t.Fatalf("expected success=true, got %v", data["success"])
	}
	if data["topic"] != "工作" {
		t.Fatalf("expected topic='工作', got %v", data["topic"])
	}
}
