# NanoPaste Backend

本目录是 NanoPaste 的真实后端实现，使用 Go 1.22、SQLite 和标准库 HTTP 路由。

## 依赖

- Go 1.22
- 可用 CGO 环境，`github.com/mattn/go-sqlite3` 需要 CGO
- 可选 `sqlite3` CLI，用于手动执行迁移 SQL

## 本地启动

```bash
cd apps/backend
go run ./cmd/server
```

默认监听 `http://localhost:8080`。

常用环境变量：

- `PORT`：服务端口，默认 `8080`
- `SQLITE_DSN`：SQLite 文件路径，默认 `./data/nanopaste.db`
- `JWT_SECRET`：JWT 签名密钥，默认 `dev-secret-change-me`，生产环境必须改为强随机字符串
- `JWT_ISSUER`：JWT issuer，默认 `nanopaste-backend`
- `ACCESS_TOKEN_TTL_MINUTES`：Access Token 有效期，默认 `60`
- `REFRESH_TOKEN_TTL_HOURS`：Refresh Token 有效期，默认 `720`
- `FILE_STORAGE_ROOT`：文件存储目录，默认 `./data/storage`
- `WEB_DIST_DIR`：前端构建产物目录，默认 `../desktop/dist`

## 数据库与迁移

服务启动时会自动创建核心表：

- `users`
- `sessions`
- `file_objects`
- `clipboard_items`

仓库仍保留 SQL 迁移文件，适合本地重建或排查：

```bash
cd apps/backend
mkdir -p data
sqlite3 ./data/nanopaste.db < ./migrations/0001_init.up.sql
```

回滚：

```bash
cd apps/backend
sqlite3 ./data/nanopaste.db < ./migrations/0001_init.down.sql
```

## 健康检查

```bash
curl http://localhost:8080/health
```

响应：

```json
{
  "ok": true,
  "data": {
    "service": "nanopaste-backend"
  }
}
```

## 托管 Web 前端

先构建前端：

```bash
cd apps/desktop
pnpm install
pnpm run build:web
```

再启动后端：

```bash
cd apps/backend
go run ./cmd/server
```

浏览器访问 `http://localhost:8080/`。后端会保留 `/v1/*` 和 `/health`，其他 GET/HEAD 路由交给静态文件处理，并在未命中时回退 `index.html`。

## 当前接口

所有 API 成功响应均为：

```json
{
  "ok": true,
  "data": {}
}
```

失败响应均为：

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "invalid json body",
    "requestId": "..."
  }
}
```

### Auth

- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`

登录请求：

```json
{
  "username": "demo",
  "password": "password"
}
```

说明：如果用户不存在，当前实现会按首次登录自动创建用户；如果用户存在，则校验密码。

登录响应：

```json
{
  "ok": true,
  "data": {
    "user_id": "...",
    "username": "demo",
    "tokens": {
      "access_token": "...",
      "refresh_token": "...",
      "expires_in_seconds": 3600
    }
  }
}
```

刷新请求：

```json
{
  "refresh_token": "..."
}
```

登出请求：

```json
{
  "refresh_token": "...",
  "all_sessions": false
}
```

### Items

- `POST /v1/items`
- `GET /v1/items?limit=20&cursor=0&type=text&sort=favorite`
- `DELETE /v1/items/:itemId`
- `POST /v1/items/:itemId/favorite`

除登录、刷新、登出和健康检查外，请求需要 `Authorization: Bearer <access_token>`。

创建文本条目：

```json
{
  "type": "text",
  "title": "可选标题",
  "content": "hello nanopaste",
  "client_event_id": "evt_001"
}
```

列表响应：

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "...",
        "type": "text",
        "title": "可选标题",
        "content": "hello nanopaste",
        "isFavorite": false,
        "createdAt": "2026-06-08T10:00:00Z"
      }
    ],
    "page": {
      "nextCursor": "20",
      "hasMore": true
    }
  }
}
```

收藏请求：

```json
{
  "favorite": true
}
```

### Files

- `POST /v1/files/upload`
- `POST /v1/files/:fileId/prepare-download`
- `GET /v1/files/download/:fileId?access_token=...`
- `POST /v1/files/cleanup`

上传使用 `multipart/form-data`：

- `file`：必填，上传文件
- `category`：可选，文件分类，默认 `other`

上传响应：

```json
{
  "ok": true,
  "data": {
    "itemId": "...",
    "fileId": "...",
    "ready": true,
    "category": "other"
  }
}
```

准备下载响应：

```json
{
  "ok": true,
  "data": {
    "fileId": "...",
    "fileName": "demo.txt",
    "fileSize": 1024,
    "downloadUrl": "/v1/files/download/...?access_token=...",
    "expiresAt": "2026-06-08T11:00:00Z",
    "category": "other"
  }
}
```

清理请求：

```json
{
  "reason": "manual",
  "itemIds": ["..."],
  "category": "other"
}
```

## 已移除或未注册接口

当前后端没有注册以下早期设计接口：

- `/v1/events`
- `/v1/events/ws`
- `/v1/devices/*`
- `/v1/files/prepare-upload`
- `/v1/files/complete`
