package middleware

import (
	"log"
	"net/http"
	"runtime/debug"

	"github.com/ronronner/my-todolist/apps/backend/internal/common"
)

func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if v := recover(); v != nil {
				requestID := common.RequestIDFromContext(r.Context())
				log.Printf("panic recovered request_id=%s path=%s panic=%v stack=%s", requestID, r.URL.Path, v, string(debug.Stack()))
				common.WriteError(w, common.INTERNAL, "internal server error", nil, requestID)
			}
		}()

		next.ServeHTTP(w, r)
	})
}
