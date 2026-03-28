package main

import (
	"log"
	"net/http"
	"os"

	"github.com/ronronner/my-todolist/apps/backend/internal/auth"
	"github.com/ronronner/my-todolist/apps/backend/internal/common"
	"github.com/ronronner/my-todolist/apps/backend/internal/devices"
	"github.com/ronronner/my-todolist/apps/backend/internal/events"
	"github.com/ronronner/my-todolist/apps/backend/internal/files"
	"github.com/ronronner/my-todolist/apps/backend/internal/items"
	"github.com/ronronner/my-todolist/apps/backend/internal/middleware"
)

type healthData struct {
	Service string `json:"service"`
}

func main() {
	mux := http.NewServeMux()
	authHandler, err := auth.NewHandler()
	if err != nil {
		log.Fatal(err)
	}

	hub, eventsHandler, err := events.NewHubAndHandler()
	if err != nil {
		log.Fatal(err)
	}

	itemsHandler, err := items.NewHandler(hub)
	if err != nil {
		log.Fatal(err)
	}

	filesHandler, err := files.NewHandler(hub)
	if err != nil {
		log.Fatal(err)
	}

	devicesHandler, err := devices.NewHandler()
	if err != nil {
		log.Fatal(err)
	}

	mux.Handle("/v1/auth/", authHandler)
	mux.Handle("/v1/items", itemsHandler)
	mux.Handle("/v1/items/", itemsHandler)
	mux.Handle("/v1/files/prepare-upload", filesHandler)
	mux.Handle("/v1/files/complete", filesHandler)
	mux.Handle("/v1/files/cleanup", filesHandler)
	mux.Handle("/v1/files/", filesHandler)
	mux.Handle("/v1/events", eventsHandler)
	mux.Handle("/v1/events/ws", eventsHandler)
	mux.Handle("/v1/devices/register", devicesHandler)
	mux.Handle("/v1/devices/heartbeat", devicesHandler)
	mux.Handle("/v1/devices", devicesHandler)
	mux.Handle("/v1/devices/revoke", devicesHandler)

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		requestID := common.RequestIDFromContext(r.Context())
		common.WriteSuccess(w, http.StatusOK, healthData{Service: "nanopaste-backend"}, requestID)
	})

	handler := middleware.Chain(mux,
		middleware.RequestID,
		middleware.Recover,
		middleware.Logger,
		middleware.CORS,
	)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err = http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal(err)
	}
}
