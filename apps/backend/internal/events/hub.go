package events

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type wsClient struct {
	conn *websocket.Conn
	mu   sync.Mutex
}

func (c *wsClient) writeJSON(v any) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
	return c.conn.WriteJSON(v)
}

func (c *wsClient) writeRaw(message []byte) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
	return c.conn.WriteMessage(websocket.TextMessage, message)
}

func (c *wsClient) close() {
	c.mu.Lock()
	defer c.mu.Unlock()
	_ = c.conn.Close()
}

type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*wsClient]struct{}
}

func NewHub() *Hub {
	return &Hub{clients: make(map[string]map[*wsClient]struct{})}
}

func (h *Hub) Register(userID string, conn *websocket.Conn) *wsClient {
	client := &wsClient{conn: conn}
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.clients[userID]; !ok {
		h.clients[userID] = make(map[*wsClient]struct{})
	}
	h.clients[userID][client] = struct{}{}
	return client
}

func (h *Hub) Unregister(userID string, client *wsClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	bucket, ok := h.clients[userID]
	if !ok {
		return
	}
	delete(bucket, client)
	if len(bucket) == 0 {
		delete(h.clients, userID)
	}
}

func (h *Hub) BroadcastEvent(ev StoredEvent) {
	message, err := wsEnvelopeJSON(ev)
	if err != nil {
		return
	}

	h.mu.RLock()
	bucket := h.clients[ev.UserID]
	clients := make([]*wsClient, 0, len(bucket))
	for client := range bucket {
		clients = append(clients, client)
	}
	h.mu.RUnlock()

	for _, client := range clients {
		if err = client.writeRaw(message); err != nil {
			client.close()
			h.Unregister(ev.UserID, client)
		}
	}
}

type wsEnvelope struct {
	Event     string          `json:"event"`
	AccountID string          `json:"accountId"`
	Timestamp string          `json:"timestamp"`
	Payload   json.RawMessage `json:"payload"`
	EventID   int64           `json:"eventId"`
}

func wsEnvelopeJSON(ev StoredEvent) ([]byte, error) {
	env := wsEnvelope{
		Event:     ev.EventType,
		AccountID: ev.UserID,
		Timestamp: ev.CreatedAt,
		Payload:   ev.Payload,
		EventID:   ev.ID,
	}
	return json.Marshal(env)
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}
