package common

import (
	"encoding/json"
	"net/http"
)

type APIResponse[T any] struct {
	OK    bool      `json:"ok"`
	Data  *T        `json:"data,omitempty"`
	Error *APIError `json:"error,omitempty"`
}

func WriteSuccess[T any](w http.ResponseWriter, status int, data T, requestID string) {
	resp := APIResponse[T]{
		OK:   true,
		Data: &data,
	}
	if requestID != "" {
		w.Header().Set("X-Request-Id", requestID)
	}
	writeJSON(w, status, resp)
}

func WriteError(w http.ResponseWriter, code ErrorCode, message string, details map[string]interface{}, requestID string) {
	status := MapErrorCodeToStatus(code)
	resp := APIResponse[map[string]interface{}]{
		OK: false,
		Error: &APIError{
			Code:      code,
			Message:   message,
			RequestID: requestID,
			Details:   details,
		},
	}
	if requestID != "" {
		w.Header().Set("X-Request-Id", requestID)
	}
	writeJSON(w, status, resp)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
