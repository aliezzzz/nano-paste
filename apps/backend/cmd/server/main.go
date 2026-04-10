package main

import (
	"log"
	"net/http"
	"os"
	"runtime"

	"github.com/ronronner/my-todolist/apps/backend/internal/auth"
	"github.com/ronronner/my-todolist/apps/backend/internal/common"
	"github.com/ronronner/my-todolist/apps/backend/internal/devices"
	"github.com/ronronner/my-todolist/apps/backend/internal/files"
	"github.com/ronronner/my-todolist/apps/backend/internal/items"
	"github.com/ronronner/my-todolist/apps/backend/internal/middleware"
	"github.com/ronronner/my-todolist/apps/backend/internal/web"
)

type healthData struct {
	Service string `json:"service"`
}

func main() {
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
	log.Printf("service=nanopaste-backend stage=startup event=boot go_version=%s pid=%d", runtime.Version(), os.Getpid())

	port, portFromEnv := envOrDefault("PORT", "8080")
	sqliteDSN, sqliteFromEnv := envOrDefault("SQLITE_DSN", "./data/nanopaste.db")
	jwtIssuer, issuerFromEnv := envOrDefault("JWT_ISSUER", "nanopaste-backend")
	accessTTLMinutes, accessTTLFromEnv := envOrDefault("ACCESS_TOKEN_TTL_MINUTES", "60")
	refreshTTLHours, refreshTTLFromEnv := envOrDefault("REFRESH_TOKEN_TTL_HOURS", "720")
	webDistDir, webDistFromEnv := envOrDefault("WEB_DIST_DIR", "../desktop/dist")
	jwtSecretSet := os.Getenv("JWT_SECRET") != ""

	log.Printf("service=nanopaste-backend stage=config port=%s port_from_env=%t sqlite_dsn=%s sqlite_dsn_from_env=%t jwt_issuer=%s jwt_issuer_from_env=%t access_ttl_minutes=%s access_ttl_from_env=%t refresh_ttl_hours=%s refresh_ttl_from_env=%t web_dist_dir=%s web_dist_dir_from_env=%t jwt_secret_set=%t", port, portFromEnv, sqliteDSN, sqliteFromEnv, jwtIssuer, issuerFromEnv, accessTTLMinutes, accessTTLFromEnv, refreshTTLHours, refreshTTLFromEnv, webDistDir, webDistFromEnv, jwtSecretSet)

	mux := http.NewServeMux()
	log.Printf("service=nanopaste-backend stage=init component=auth_handler status=starting")
	authHandler, err := auth.NewHandler()
	if err != nil {
		log.Fatalf("service=nanopaste-backend stage=init component=auth_handler status=failed err=%v", err)
	}
	log.Printf("service=nanopaste-backend stage=init component=auth_handler status=ready")

	log.Printf("service=nanopaste-backend stage=init component=items_handler status=starting")
	itemsHandler, err := items.NewHandler()
	if err != nil {
		log.Fatalf("service=nanopaste-backend stage=init component=items_handler status=failed err=%v", err)
	}
	log.Printf("service=nanopaste-backend stage=init component=items_handler status=ready")

	log.Printf("service=nanopaste-backend stage=init component=files_handler status=starting")
	filesHandler, err := files.NewHandler()
	if err != nil {
		log.Fatalf("service=nanopaste-backend stage=init component=files_handler status=failed err=%v", err)
	}
	log.Printf("service=nanopaste-backend stage=init component=files_handler status=ready")

	log.Printf("service=nanopaste-backend stage=init component=devices_handler status=starting")
	devicesHandler, err := devices.NewHandler()
	if err != nil {
		log.Fatalf("service=nanopaste-backend stage=init component=devices_handler status=failed err=%v", err)
	}
	log.Printf("service=nanopaste-backend stage=init component=devices_handler status=ready")

	log.Printf("service=nanopaste-backend stage=init component=web_handler status=starting")
	webHandler, err := web.NewHandler(webDistDir)
	if err != nil {
		log.Printf("service=nanopaste-backend stage=init component=web_handler status=disabled reason=%v", err)
	} else {
		log.Printf("service=nanopaste-backend stage=init component=web_handler status=ready")
	}

	mux.Handle("/v1/auth/", authHandler)
	mux.Handle("/v1/items", itemsHandler)
	mux.Handle("/v1/items/", itemsHandler)
	mux.Handle("/v1/files/upload", filesHandler)
	mux.Handle("/v1/files/cleanup", filesHandler)
	mux.Handle("/v1/files/", filesHandler)
	mux.Handle("/v1/devices/register", devicesHandler)
	mux.Handle("/v1/devices/heartbeat", devicesHandler)
	mux.Handle("/v1/devices", devicesHandler)
	mux.Handle("/v1/devices/revoke", devicesHandler)

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		requestID := common.RequestIDFromContext(r.Context())
		common.WriteSuccess(w, http.StatusOK, healthData{Service: "nanopaste-backend"}, requestID)
	})

	if webHandler != nil {
		mux.Handle("/", webHandler)
	}

	handler := middleware.Chain(mux,
		middleware.RequestID,
		middleware.Recover,
		middleware.Logger,
		middleware.CORS,
	)

	log.Printf("service=nanopaste-backend stage=startup event=routes_registered")
	log.Printf("service=nanopaste-backend stage=startup event=listening addr=:%s", port)

	if err = http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("service=nanopaste-backend stage=runtime event=listen_failed addr=:%s err=%v", port, err)
	}
}

func envOrDefault(key, def string) (string, bool) {
	v := os.Getenv(key)
	if v == "" {
		return def, false
	}
	return v, true
}
