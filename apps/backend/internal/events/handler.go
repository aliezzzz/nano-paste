package events

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/ronronner/my-todolist/apps/backend/internal/authx"
	"github.com/ronronner/my-todolist/apps/backend/internal/common"
	"github.com/ronronner/my-todolist/apps/backend/internal/db"
)

type handler struct {
	repo *repository
	hub  *Hub
}

func NewHandler(hub *Hub) (http.Handler, error) {
	sqlite, err := db.SQLite()
	if err != nil {
		return nil, err
	}

	h := &handler{repo: newRepository(sqlite), hub: hub}
	mux := http.NewServeMux()
	mux.HandleFunc("/v1/events", h.listEvents)
	mux.HandleFunc("/v1/events/ws", h.ws)
	return mux, nil
}

func (h *handler) listEvents(w http.ResponseWriter, r *http.Request) {
	requestID := common.RequestIDFromContext(r.Context())
	if r.Method != http.MethodGet {
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
		return
	}

	userID, err := authx.UserIDFromRequest(r)
	if err != nil {
		common.WriteError(w, common.UNAUTHORIZED, "missing or invalid access token", nil, requestID)
		return
	}

	deviceID, err := authx.DeviceIDFromRequest(r)
	if err != nil {
		common.WriteError(w, common.UNAUTHORIZED, "missing or invalid access token", nil, requestID)
		return
	}

	sinceEventID := int64(-1)
	rawSince := strings.TrimSpace(r.URL.Query().Get("since_event_id"))
	if rawSince == "" {
		rawSince = strings.TrimSpace(r.URL.Query().Get("sinceEventId"))
	}
	if rawSince != "" {
		sinceEventID, err = strconv.ParseInt(rawSince, 10, 64)
		if err != nil || sinceEventID < 0 {
			common.WriteError(w, common.VALIDATION_ERROR, "since_event_id must be >= 0", nil, requestID)
			return
		}
	}

	limit := 50
	if rawLimit := strings.TrimSpace(r.URL.Query().Get("limit")); rawLimit != "" {
		parsed, parseErr := strconv.Atoi(rawLimit)
		if parseErr != nil || parsed <= 0 {
			common.WriteError(w, common.VALIDATION_ERROR, "limit must be > 0", nil, requestID)
			return
		}
		if parsed > 200 {
			parsed = 200
		}
		limit = parsed
	}

	if sinceEventID < 0 {
		sinceEventID, err = h.repo.LastCursor(r.Context(), userID, deviceID)
		if err != nil {
			common.WriteError(w, common.INTERNAL, "failed to load sync cursor", nil, requestID)
			return
		}
	}

	events, err := h.repo.ListEvents(r.Context(), userID, sinceEventID, limit)
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to list events", nil, requestID)
		return
	}

	nextSince := sinceEventID
	items := make([]eventView, 0, len(events))
	for _, ev := range events {
		payload, payloadErr := decodePayload(ev.Payload)
		if payloadErr != nil {
			common.WriteError(w, common.INTERNAL, "failed to decode event payload", nil, requestID)
			return
		}
		items = append(items, toEventView(ev, payload))
		if ev.ID > nextSince {
			nextSince = ev.ID
		}
	}

	if err = h.repo.UpsertCursor(r.Context(), userID, deviceID, nextSince); err != nil {
		common.WriteError(w, common.INTERNAL, "failed to upsert sync cursor", nil, requestID)
		return
	}

	common.WriteSuccess(w, http.StatusOK, listEventsResponse{
		Events:           items,
		NextSinceEventID: nextSince,
	}, requestID)
}

func (h *handler) ws(w http.ResponseWriter, r *http.Request) {
	requestID := common.RequestIDFromContext(r.Context())
	userID, err := authx.UserIDFromRequest(r)
	if err != nil {
		common.WriteError(w, common.UNAUTHORIZED, "missing or invalid access token", nil, requestID)
		return
	}

	deviceID, err := authx.DeviceIDFromRequest(r)
	if err != nil {
		common.WriteError(w, common.UNAUTHORIZED, "missing or invalid access token", nil, requestID)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	client := h.hub.Register(userID, conn)
	defer func() {
		h.hub.Unregister(userID, client)
		client.close()
	}()

	conn.SetReadLimit(4096)
	_ = conn.SetReadDeadline(time.Now().Add(120 * time.Second))
	conn.SetPongHandler(func(string) error {
		return conn.SetReadDeadline(time.Now().Add(120 * time.Second))
	})

	sinceEventID := int64(0)
	if rawSince := strings.TrimSpace(r.URL.Query().Get("since_event_id")); rawSince != "" {
		if parsed, parseErr := strconv.ParseInt(rawSince, 10, 64); parseErr == nil && parsed >= 0 {
			sinceEventID = parsed
		}
	} else {
		last, cursorErr := h.repo.LastCursor(r.Context(), userID, deviceID)
		if cursorErr == nil {
			sinceEventID = last
		}
	}

	limit := 100
	if rawLimit := strings.TrimSpace(r.URL.Query().Get("limit")); rawLimit != "" {
		if parsed, parseErr := strconv.Atoi(rawLimit); parseErr == nil && parsed > 0 {
			if parsed > 500 {
				parsed = 500
			}
			limit = parsed
		}
	}

	h.replayEvents(r.Context(), userID, deviceID, sinceEventID, limit, client)

	for {
		if _, _, err = conn.ReadMessage(); err != nil {
			break
		}
	}
}

func (h *handler) replayEvents(ctx context.Context, userID, deviceID string, sinceEventID int64, limit int, client *wsClient) {
	events, err := h.repo.ListEvents(ctx, userID, sinceEventID, limit)
	if err != nil {
		return
	}

	nextSince := sinceEventID
	for _, ev := range events {
		msg, mErr := wsEnvelopeJSON(ev)
		if mErr != nil {
			continue
		}
		if wErr := client.writeRaw(msg); wErr != nil {
			return
		}
		if ev.ID > nextSince {
			nextSince = ev.ID
		}
	}

	_ = h.repo.UpsertCursor(ctx, userID, deviceID, nextSince)
}

type eventView struct {
	ID        int64          `json:"id"`
	EventType string         `json:"event_type"`
	ItemID    *string        `json:"item_id,omitempty"`
	FileID    *string        `json:"file_id,omitempty"`
	Payload   map[string]any `json:"payload"`
	CreatedAt string         `json:"created_at"`
}

type listEventsResponse struct {
	Events           []eventView `json:"events"`
	NextSinceEventID int64       `json:"next_since_event_id"`
}

func decodePayload(raw json.RawMessage) (map[string]any, error) {
	out := map[string]any{}
	if len(raw) == 0 {
		return out, nil
	}
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, fmt.Errorf("unmarshal payload: %w", err)
	}
	return out, nil
}

func toEventView(ev StoredEvent, payload map[string]any) eventView {
	return eventView{
		ID:        ev.ID,
		EventType: ev.EventType,
		ItemID:    ev.ItemID,
		FileID:    ev.FileID,
		Payload:   payload,
		CreatedAt: ev.CreatedAt,
	}
}

func NewHubAndHandler() (*Hub, http.Handler, error) {
	hub := NewHub()
	h, err := NewHandler(hub)
	if err != nil {
		return nil, nil, err
	}
	return hub, h, nil
}
