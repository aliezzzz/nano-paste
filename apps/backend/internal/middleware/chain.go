package middleware

import "net/http"

func Chain(h http.Handler, mws ...func(http.Handler) http.Handler) http.Handler {
	wrapped := h
	for i := len(mws) - 1; i >= 0; i-- {
		wrapped = mws[i](wrapped)
	}
	return wrapped
}
