package items

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/ronronner/my-todolist/apps/backend/internal/authx"
	"github.com/ronronner/my-todolist/apps/backend/internal/common"
	"github.com/ronronner/my-todolist/apps/backend/internal/db"
)

type handler struct {
	repo *repository
}

func NewHandler() (http.Handler, error) {
	sqlite, err := db.SQLite()
	if err != nil {
		return nil, err
	}

	h := &handler{repo: newRepository(sqlite)}
	mux := http.NewServeMux()
	mux.HandleFunc("/v1/items", h.items)
	mux.HandleFunc("/v1/items/", h.itemByID)
	return mux, nil
}

func (h *handler) items(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		h.create(w, r)
	case http.MethodGet:
		h.list(w, r)
	default:
		requestID := common.RequestIDFromContext(r.Context())
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
	}
}

func (h *handler) itemByID(w http.ResponseWriter, r *http.Request) {
	trimmed := strings.TrimSpace(strings.TrimPrefix(r.URL.Path, "/v1/items/"))
	if trimmed == "" {
		requestID := common.RequestIDFromContext(r.Context())
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
		return
	}

	if strings.HasSuffix(trimmed, "/favorite") {
		itemID := strings.TrimSpace(strings.TrimSuffix(trimmed, "/favorite"))
		if itemID == "" || strings.Contains(itemID, "/") {
			requestID := common.RequestIDFromContext(r.Context())
			common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
			return
		}
		if r.Method != http.MethodPost {
			requestID := common.RequestIDFromContext(r.Context())
			common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
			return
		}
		h.favorite(w, r, itemID)
		return
	}

	itemID := trimmed
	if strings.Contains(itemID, "/") {
		requestID := common.RequestIDFromContext(r.Context())
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
		return
	}

	switch r.Method {
	case http.MethodDelete:
		h.delete(w, r, itemID)
	default:
		requestID := common.RequestIDFromContext(r.Context())
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
	}
}

func (h *handler) create(w http.ResponseWriter, r *http.Request) {
	requestID := common.RequestIDFromContext(r.Context())
	userID, err := authx.UserIDFromRequest(r)
	if err != nil {
		common.WriteError(w, common.UNAUTHORIZED, "missing or invalid access token", nil, requestID)
		return
	}

	var req createItemRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.WriteError(w, common.VALIDATION_ERROR, "invalid json body", nil, requestID)
		return
	}

	if strings.TrimSpace(req.Type) != "text" {
		common.WriteError(w, common.VALIDATION_ERROR, "only text type is supported in this step", nil, requestID)
		return
	}
	if strings.TrimSpace(req.Content) == "" {
		common.WriteError(w, common.VALIDATION_ERROR, "content is required", nil, requestID)
		return
	}

	item, err := h.repo.createTextItem(r.Context(), userID, req.Title, req.Content, req.clientEventID())
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to create item", nil, requestID)
		return
	}

	common.WriteSuccess(w, http.StatusCreated, createItemResponse{
		Item: toItemDetail(item),
	}, requestID)
}

func (h *handler) list(w http.ResponseWriter, r *http.Request) {
	requestID := common.RequestIDFromContext(r.Context())
	userID, err := authx.UserIDFromRequest(r)
	if err != nil {
		common.WriteError(w, common.UNAUTHORIZED, "missing or invalid access token", nil, requestID)
		return
	}

	limit := 20
	if rawLimit := strings.TrimSpace(r.URL.Query().Get("limit")); rawLimit != "" {
		parsed, parseErr := strconv.Atoi(rawLimit)
		if parseErr != nil || parsed <= 0 {
			common.WriteError(w, common.VALIDATION_ERROR, "limit must be > 0", nil, requestID)
			return
		}
		if parsed > 100 {
			parsed = 100
		}
		limit = parsed
	}

	offset := 0
	if rawOffset := strings.TrimSpace(r.URL.Query().Get("cursor")); rawOffset != "" {
		parsed, parseErr := strconv.Atoi(rawOffset)
		if parseErr != nil || parsed < 0 {
			common.WriteError(w, common.VALIDATION_ERROR, "cursor must be >= 0", nil, requestID)
			return
		}
		offset = parsed
	}

	itemType := strings.TrimSpace(r.URL.Query().Get("type"))
	if itemType != "" && itemType != "text" && itemType != "file" {
		common.WriteError(w, common.VALIDATION_ERROR, "type must be text or file", nil, requestID)
		return
	}

	sort := strings.TrimSpace(r.URL.Query().Get("sort"))
	if sort != "" && sort != "favorite" {
		common.WriteError(w, common.VALIDATION_ERROR, "sort must be favorite", nil, requestID)
		return
	}

	items, hasMore, err := h.repo.listItems(r.Context(), userID, itemType, sort, limit, offset)
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to list items", nil, requestID)
		return
	}

	details := make([]map[string]any, 0, len(items))
	for _, it := range items {
		details = append(details, toItemDetail(it))
	}

	var nextCursor *string
	if hasMore {
		next := strconv.Itoa(offset + len(items))
		nextCursor = &next
	}

	common.WriteSuccess(w, http.StatusOK, listItemsResponse{
		Items: details,
		Page: pageMeta{
			NextCursor: nextCursor,
			HasMore:    hasMore,
		},
	}, requestID)
}

func (h *handler) delete(w http.ResponseWriter, r *http.Request, itemID string) {
	requestID := common.RequestIDFromContext(r.Context())
	userID, err := authx.UserIDFromRequest(r)
	if err != nil {
		common.WriteError(w, common.UNAUTHORIZED, "missing or invalid access token", nil, requestID)
		return
	}

	deletedAt, err := h.repo.deleteItem(r.Context(), userID, itemID)
	if err != nil {
		if err == errItemNotFound {
			common.WriteError(w, common.NOT_FOUND, "item not found", nil, requestID)
			return
		}
		common.WriteError(w, common.INTERNAL, "failed to delete item", nil, requestID)
		return
	}

	common.WriteSuccess(w, http.StatusOK, deleteItemResponse{
		Success:   true,
		DeletedAt: deletedAt,
	}, requestID)
}

func (h *handler) favorite(w http.ResponseWriter, r *http.Request, itemID string) {
	requestID := common.RequestIDFromContext(r.Context())
	userID, err := authx.UserIDFromRequest(r)
	if err != nil {
		common.WriteError(w, common.UNAUTHORIZED, "missing or invalid access token", nil, requestID)
		return
	}

	var req favoriteItemRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.WriteError(w, common.VALIDATION_ERROR, "invalid json body", nil, requestID)
		return
	}

	item, updatedAt, err := h.repo.setItemFavorite(r.Context(), userID, itemID, req.Favorite)
	if err != nil {
		if err == errItemNotFound {
			common.WriteError(w, common.NOT_FOUND, "item not found", nil, requestID)
			return
		}
		common.WriteError(w, common.INTERNAL, "failed to update item favorite", nil, requestID)
		return
	}

	common.WriteSuccess(w, http.StatusOK, favoriteItemResponse{
		Success:   true,
		ItemID:    item.ID,
		Favorite:  item.IsFavorite,
		UpdatedAt: updatedAt,
	}, requestID)
}

type createItemRequest struct {
	Type               string `json:"type"`
	Title              string `json:"title"`
	Content            string `json:"content"`
	ClientEventID      string `json:"client_event_id"`
	ClientEventIDCamel string `json:"clientEventId"`
}

func (r createItemRequest) clientEventID() string {
	if strings.TrimSpace(r.ClientEventID) != "" {
		return strings.TrimSpace(r.ClientEventID)
	}
	return strings.TrimSpace(r.ClientEventIDCamel)
}

type createItemResponse struct {
	Item map[string]any `json:"item"`
}

type listItemsResponse struct {
	Items []map[string]any `json:"items"`
	Page  pageMeta         `json:"page"`
}

type pageMeta struct {
	NextCursor *string `json:"nextCursor,omitempty"`
	HasMore    bool    `json:"hasMore"`
}

type deleteItemResponse struct {
	Success   bool   `json:"success"`
	DeletedAt string `json:"deletedAt"`
}

type favoriteItemRequest struct {
	Favorite bool `json:"favorite"`
}

type favoriteItemResponse struct {
	Success   bool   `json:"success"`
	ItemID    string `json:"itemId"`
	Favorite  bool   `json:"favorite"`
	UpdatedAt string `json:"updatedAt"`
}

func toItemDetail(item itemRecord) map[string]any {
	base := map[string]any{
		"id":         item.ID,
		"type":       item.Type,
		"isFavorite": item.IsFavorite,
		"createdAt":  item.CreatedAt,
	}
	if strings.TrimSpace(item.Title) != "" {
		base["title"] = item.Title
	}

	if item.Type == "file" {
		base["fileId"] = item.FileID
		base["fileName"] = item.FileName
		base["fileSize"] = item.FileSize
		if strings.TrimSpace(item.MimeType) != "" {
			base["mimeType"] = item.MimeType
		}
		return base
	}

	base["content"] = item.Content
	return base
}
