package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/golang-jwt/jwt/v5"
	"github.com/ronronner/my-todolist/apps/backend/internal/db"
	"github.com/ronronner/my-todolist/apps/backend/internal/items"
)

func TestMain(m *testing.M) {
	dir, err := os.MkdirTemp("", "nanopaste-routes-*")
	if err != nil {
		panic(err)
	}
	defer os.RemoveAll(dir)

	os.Setenv("SQLITE_DSN", dir+"/nanopaste.db")
	os.Setenv("JWT_SECRET", "test-secret")
	os.Exit(m.Run())
}

func TestTopicsRouteIsRegistered(t *testing.T) {
	itemsHandler, err := items.NewHandler()
	if err != nil {
		t.Fatalf("new items handler: %v", err)
	}

	mux := http.NewServeMux()
	mux.Handle("/v1/items", itemsHandler)
	mux.Handle("/v1/items/", itemsHandler)
	mux.Handle("/v1/topics", itemsHandler)

	req := httptest.NewRequest(http.MethodGet, "/v1/topics", nil)
	req.Header.Set("Authorization", "Bearer "+testAccessToken(t, "u-1"))

	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp struct {
		OK   bool `json:"ok"`
		Data struct {
			Topics []struct {
				Name  string `json:"name"`
				Count int    `json:"count"`
			} `json:"topics"`
		} `json:"data"`
	}
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if !resp.OK {
		t.Fatalf("expected ok response, got %#v", resp)
	}
	if len(resp.Data.Topics) != 0 {
		t.Fatalf("expected empty topics, got %#v", resp.Data.Topics)
	}
}

func TestSetTopicRouteAcceptsPost(t *testing.T) {
	server := newTestItemsServer(t)
	token := testAccessToken(t, "u-1")

	created := requestJSON(t, server, http.MethodPost, "/v1/items", token, map[string]any{
		"type":    "text",
		"content": "content",
	})
	item := created["data"].(map[string]any)["item"].(map[string]any)
	itemID := item["id"].(string)

	updated := requestJSON(t, server, http.MethodPost, "/v1/items/"+itemID+"/topic", token, map[string]any{
		"topic": "工作",
	})
	data := updated["data"].(map[string]any)

	if updated["ok"] != true {
		t.Fatalf("expected ok response, got %#v", updated)
	}
	if data["topic"] != "工作" {
		t.Fatalf("expected topic '工作', got %#v", data["topic"])
	}
}

func TestSetTopicRouteRejectsUnsupportedMethod(t *testing.T) {
	server := newTestItemsServer(t)
	req := httptest.NewRequest(http.MethodGet, "/v1/items/item-1/topic", nil)
	req.Header.Set("Authorization", "Bearer "+testAccessToken(t, "u-1"))

	w := httptest.NewRecorder()
	server.ServeHTTP(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected status 405, got %d: %s", w.Code, w.Body.String())
	}
}

func newTestItemsServer(t *testing.T) http.Handler {
	t.Helper()

	itemsHandler, err := items.NewHandler()
	if err != nil {
		t.Fatalf("new items handler: %v", err)
	}
	ensureTestUser(t, "u-1")

	mux := http.NewServeMux()
	mux.Handle("/v1/items", itemsHandler)
	mux.Handle("/v1/items/", itemsHandler)
	mux.Handle("/v1/topics", itemsHandler)
	return mux
}

func ensureTestUser(t *testing.T, userID string) {
	t.Helper()

	sqlite, err := db.SQLite()
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if _, err = sqlite.Exec(`
		INSERT OR IGNORE INTO users(id, account, password_hash)
		VALUES(?, ?, ?)`, userID, userID, "test-password-hash"); err != nil {
		t.Fatalf("insert test user: %v", err)
	}
}

func requestJSON(t *testing.T, handler http.Handler, method, path, token string, body map[string]any) map[string]any {
	t.Helper()

	payload, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal request: %v", err)
	}
	req := httptest.NewRequest(method, path, bytes.NewReader(payload))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code < 200 || w.Code >= 300 {
		t.Fatalf("expected success status, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]any
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return resp
}

func testAccessToken(t *testing.T, userID string) string {
	t.Helper()

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID,
	})
	signed, err := token.SignedString([]byte("test-secret"))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return signed
}
