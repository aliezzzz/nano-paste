# syntax=docker/dockerfile:1.7

############################
# 1) Build Web static files
############################
FROM node:20-alpine AS web-builder
WORKDIR /src/apps/desktop

COPY apps/desktop/package*.json ./
RUN npm install

COPY packages/contracts /src/packages/contracts
COPY apps/desktop ./
RUN npm run build:web

############################
# 2) Build Go backend binary
############################
FROM golang:1.22-bookworm AS backend-builder
WORKDIR /src/apps/backend

# github.com/mattn/go-sqlite3 requires cgo toolchain
RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY apps/backend/go.mod apps/backend/go.sum ./
RUN go mod download

COPY apps/backend ./
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/nanopaste ./cmd/server

############################
# 3) Runtime image
############################
FROM debian:bookworm-slim
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates tzdata \
  && rm -rf /var/lib/apt/lists/*

RUN useradd -r -u 10001 -g root appuser

COPY --from=backend-builder /out/nanopaste /app/nanopaste
COPY --from=web-builder /src/apps/desktop/dist /app/web

RUN mkdir -p /data && chown -R appuser:root /app /data

ENV PORT=8080
ENV SQLITE_DSN=/data/nanopaste.db
ENV WEB_DIST_DIR=/app/web
ENV JWT_ISSUER=nanopaste-backend
ENV ACCESS_TOKEN_TTL_MINUTES=60
ENV REFRESH_TOKEN_TTL_HOURS=720

VOLUME ["/data"]
EXPOSE 8080

USER appuser
ENTRYPOINT ["/app/nanopaste"]
