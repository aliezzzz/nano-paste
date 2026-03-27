package middleware

import (
	"log"
	"net/http"
	"time"

	"github.com/ronronner/my-todolist/apps/backend/internal/common"
)

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(rec, r)

		requestID := common.RequestIDFromContext(r.Context())
		log.Printf("method=%s path=%s status=%d duration=%s request_id=%s", r.Method, r.URL.Path, rec.status, time.Since(start), requestID)
	})
}
