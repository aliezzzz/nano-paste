# NanoPaste Backend API

本文档对应当前 Go + SQLite 后端实现。

## 基础信息

- Base URL：`http://localhost:8080`
- API 前缀：`/v1`
- 认证方式：`Authorization: Bearer <access_token>`
- 请求 ID：服务端会透传或生成 `X-Request-Id`

成功响应：

```json
{
  "ok": true,
  "data": {}
}
```

失败响应：

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

错误码：

- `UNAUTHORIZED` -> 401
- `FORBIDDEN` -> 403
- `NOT_FOUND` -> 404
- `CONFLICT` -> 409
- `RATE_LIMIT` -> 429
- `VALIDATION_ERROR` -> 400
- `INTERNAL` -> 500

## Health

### GET `/health`

响应：

```json
{
  "ok": true,
  "data": {
    "service": "nanopaste-backend"
  }
}
```

## Auth

### POST `/v1/auth/login`

请求：

```json
{
  "username": "demo",
  "password": "password"
}
```

响应：

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

当前实现会在用户不存在时自动创建用户；用户已存在时校验密码。

### POST `/v1/auth/refresh`

请求兼容 `refresh_token` 与 `refreshToken`：

```json
{
  "refresh_token": "..."
}
```

响应：

```json
{
  "ok": true,
  "data": {
    "tokens": {
      "access_token": "...",
      "refresh_token": "...",
      "expires_in_seconds": 3600
    }
  }
}
```

### POST `/v1/auth/logout`

请求兼容 `refresh_token` / `refreshToken` 和 `all_sessions` / `allSessions`：

```json
{
  "refresh_token": "...",
  "all_sessions": false
}
```

响应：

```json
{
  "ok": true,
  "data": {
    "success": true
  }
}
```

## Items

Items 接口需要 `Authorization: Bearer <access_token>`。

### POST `/v1/items`

请求：

```json
{
  "type": "text",
  "title": "可选标题",
  "content": "hello nanopaste",
  "client_event_id": "evt_001"
}
```

`client_event_id` 也兼容 `clientEventId`，用于生成幂等条目 ID。

响应：

```json
{
  "ok": true,
  "data": {
    "item": {
      "id": "...",
      "type": "text",
      "title": "可选标题",
      "content": "hello nanopaste",
      "isFavorite": false,
      "createdAt": "2026-06-08T10:00:00Z"
    }
  }
}
```

### GET `/v1/items`

查询参数：

- `limit`：默认 `20`，最大 `100`
- `cursor`：偏移游标，默认 `0`
- `type`：可选，`text` 或 `file`
- `sort`：可选，目前仅支持 `favorite`

响应：

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "...",
        "type": "file",
        "title": "可选标题",
        "fileId": "...",
        "fileName": "demo.txt",
        "fileSize": 1024,
        "mimeType": "text/plain",
        "isFavorite": true,
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

### DELETE `/v1/items/:itemId`

响应：

```json
{
  "ok": true,
  "data": {
    "success": true,
    "deletedAt": "2026-06-08T10:10:00Z"
  }
}
```

### POST `/v1/items/:itemId/favorite`

请求：

```json
{
  "favorite": true
}
```

响应：

```json
{
  "ok": true,
  "data": {
    "success": true,
    "itemId": "...",
    "favorite": true,
    "updatedAt": "2026-06-08T10:10:00Z"
  }
}
```

## Files

Files 接口需要 `Authorization: Bearer <access_token>`，下载直链可通过 `access_token` 查询参数鉴权。

### POST `/v1/files/upload`

请求类型：`multipart/form-data`

字段：

- `file`：必填，上传文件
- `category`：可选，文件分类，默认 `other`

响应：

```json
{
  "ok": true,
  "data": {
    "itemId": "...",
    "fileId": "...",
    "ready": true,
    "category": "image"
  }
}
```

### POST `/v1/files/:fileId/prepare-download`

响应：

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

### GET `/v1/files/download/:fileId?access_token=...`

返回文件内容，响应头包含：

- `Content-Type`
- `Content-Disposition`
- `Content-Length`

### POST `/v1/files/cleanup`

请求兼容 `itemIds` / `item_ids` 和 `beforeTime` / `before_time`：

```json
{
  "reason": "manual",
  "itemIds": ["..."],
  "beforeTime": "2026-06-08T10:00:00Z",
  "category": "other"
}
```

响应：

```json
{
  "ok": true,
  "data": {
    "success": true,
    "reason": "manual",
    "removed": 1,
    "removedFileIds": ["..."],
    "cleanedAt": "2026-06-08T10:10:00Z"
  }
}
```

## 当前未注册接口

以下早期设计接口当前没有在后端注册：

- `/v1/events`
- `/v1/events/ws`
- `/v1/devices/*`
- `/v1/files/prepare-upload`
- `/v1/files/complete`
