package common

import "net/http"

type ErrorCode string

const (
	UNAUTHORIZED     ErrorCode = "UNAUTHORIZED"
	FORBIDDEN        ErrorCode = "FORBIDDEN"
	NOT_FOUND        ErrorCode = "NOT_FOUND"
	CONFLICT         ErrorCode = "CONFLICT"
	RATE_LIMIT       ErrorCode = "RATE_LIMIT"
	INTERNAL         ErrorCode = "INTERNAL"
	VALIDATION_ERROR ErrorCode = "VALIDATION_ERROR"
)

type APIError struct {
	Code      ErrorCode              `json:"code"`
	Message   string                 `json:"message"`
	RequestID string                 `json:"requestId,omitempty"`
	Details   map[string]interface{} `json:"details,omitempty"`
}

func MapErrorCodeToStatus(code ErrorCode) int {
	switch code {
	case UNAUTHORIZED:
		return http.StatusUnauthorized
	case FORBIDDEN:
		return http.StatusForbidden
	case NOT_FOUND:
		return http.StatusNotFound
	case CONFLICT:
		return http.StatusConflict
	case RATE_LIMIT:
		return http.StatusTooManyRequests
	case VALIDATION_ERROR:
		return http.StatusBadRequest
	case INTERNAL:
		fallthrough
	default:
		return http.StatusInternalServerError
	}
}
