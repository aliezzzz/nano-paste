# NanoPaste Backend（本地运行与联调）

本文档说明后端在本地的依赖、启动、数据库与迁移方式，并给出当前已实现接口与常用 `curl` 示例。

## 依赖

- Go 1.22（见 `go.mod`）
- CGO 可用环境（`github.com/mattn/go-sqlite3` 需要）
- （可选）`sqlite3` CLI，用于手动执行迁移 SQL

## 本地启动

在仓库根目录执行：

```bash
cd apps/backend
go run ./cmd/server
```

默认监听：`http://localhost:8080`

可选环境变量（常用）：

- `PORT`：服务端口，默认 `8080`
- `SQLITE_DSN`：SQLite 文件路径，默认 `./data/nanopaste.db`
- `JWT_SECRET`：JWT 签名密钥，默认 `dev-secret-change-me`
- `JWT_ISSUER`：JWT issuer，默认 `nanopaste-backend`
- `ACCESS_TOKEN_TTL_MINUTES`：Access Token 时长（分钟），默认 `60`
- `REFRESH_TOKEN_TTL_HOURS`：Refresh Token 时长（小时），默认 `720`

示例：

```bash
cd apps/backend
PORT=8080 SQLITE_DSN=./data/nanopaste.db JWT_SECRET=dev-secret-change-me go run ./cmd/server
```

## SQLite 文件位置

- 默认数据库文件：`apps/backend/data/nanopaste.db`
- 若设置 `SQLITE_DSN`，则以该路径为准

说明：服务启动时会自动 `mkdir -p` 数据目录并确保核心表存在。

## 迁移执行（当前为手动 SQL）

当前仓库提供 SQL 迁移文件：

- `migrations/0001_init.up.sql`
- `migrations/0001_init.down.sql`

手动执行步骤：

```bash
cd apps/backend
mkdir -p data
sqlite3 ./data/nanopaste.db < ./migrations/0001_init.up.sql
```

回滚示例：

```bash
cd apps/backend
sqlite3 ./data/nanopaste.db < ./migrations/0001_init.down.sql
```

> 备注：即使未手动执行迁移，当前服务启动时也会自动创建主要表结构；手动迁移更适合本地重建或排查场景。

## 健康检查

```bash
curl http://localhost:8080/health
```

## 已实现接口清单

### auth

- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`

### items

- `POST /v1/items`
- `GET /v1/items`
- `GET /v1/items/:itemId`
- `DELETE /v1/items/:itemId`

### events

- `GET /v1/events`
- `GET /v1/events/ws`（WebSocket 升级）

### files

- `POST /v1/files/prepare-upload`
- `POST /v1/files/complete`
- `POST /v1/files/:fileId/prepare-download`
- `POST /v1/files/cleanup`

### devices

- `POST /v1/devices/register`
- `POST /v1/devices/heartbeat`
- `GET /v1/devices`
- `POST /v1/devices/revoke`

## 常用 curl 示例

先登录获取 token（后续请求复用）：

```bash
curl -X POST http://localhost:8080/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "account": "desktop-demo",
    "password": "mock-password",
    "deviceName": "Desktop Local",
    "platform": "macos",
    "clientVersion": "0.1.0"
  }'
```

请将响应中的 `access_token` 填入下文 `YOUR_ACCESS_TOKEN`。

### auth（刷新）

```bash
curl -X POST http://localhost:8080/v1/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

### items（创建文本条目）

```bash
curl -X POST http://localhost:8080/v1/items \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'X-Device-Id: desktop_local' \
  -d '{"type":"text","content":"hello nanopaste"}'
```

### events（拉取事件）

```bash
curl 'http://localhost:8080/v1/events?since_event_id=0&limit=50' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'X-Device-Id: desktop_local'
```

### files（准备上传）

```bash
curl -X POST http://localhost:8080/v1/files/prepare-upload \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -d '{
    "fileName": "demo.txt",
    "fileSize": 1024,
    "mimeType": "text/plain",
    "category": "other"
  }'
```

### devices（设备列表）

```bash
curl http://localhost:8080/v1/devices \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```
