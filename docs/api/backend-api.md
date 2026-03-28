# NanoPaste Backend API 文档（Go + SQLite）

本文档对应当前后端实现，目标是让桌面端可以直接对接真实后端。

## 1. 基础信息

- Base URL: `http://localhost:8080`
- 统一前缀: `/v1`
- 认证方式: `Authorization: Bearer <access_token>`
- 设备标识（建议）: `X-Device-Id: <device_id>`
- 响应包装:
  - 成功: `{ "ok": true, "data": ... }`
  - 失败: `{ "ok": false, "error": { "code": "...", "message": "...", "requestId": "..." } }`

## 2. 错误码

- `UNAUTHORIZED` -> 401
- `FORBIDDEN` -> 403
- `NOT_FOUND` -> 404
- `CONFLICT` -> 409
- `RATE_LIMIT` -> 429
- `VALIDATION_ERROR` -> 400
- `INTERNAL` -> 500

## 3. 健康检查

### GET `/health`

响应示例：

```json
{
  "ok": true,
  "service": "nanopaste-backend"
}
```

---

## 4. Auth

### POST `/v1/auth/login`

请求：

```json
{
  "username": "desktop-demo",
  "password": "mock-password",
  "device_name": "Desktop Local",
  "platform": "macos",
  "client_version": "0.1.0"
}
```

响应（字段名以当前实现为准）：

```json
{
  "ok": true,
  "data": {
    "user_id": "u_xxx",
    "username": "desktop-demo",
    "account": "desktop-demo",
    "tokens": {
      "access_token": "...",
      "refresh_token": "...",
      "expires_in_seconds": 3600
    }
  }
}
```

### POST `/v1/auth/refresh`

请求：

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

请求：

```json
{
  "refresh_token": "...",
  "all_devices": false
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

---

## 5. Items

### POST `/v1/items`

请求（文本条目）：

```json
{
  "type": "text",
  "content": "hello nanopaste",
  "client_event_id": "evt_001"
}
```

响应：

```json
{
  "ok": true,
  "data": {
    "item_id": "itm_xxx",
    "event_id": 1001,
    "created_at": "2026-03-27T16:00:00Z"
  }
}
```

### GET `/v1/items?since_event_id=0&limit=20&type=text`

响应：

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "itm_xxx",
        "type": "text",
        "preview": "hello...",
        "created_at": "2026-03-27T16:00:00Z",
        "created_by_device_id": "dev_xxx"
      }
    ],
    "next_since_event_id": 1001
  }
}
```

### GET `/v1/items/:itemId`

文件条目响应示例：

```json
{
  "ok": true,
  "data": {
    "id": "itm_file_xxx",
    "type": "file",
    "file_id": "file_xxx",
    "file_name": "demo.txt",
    "size": 1024,
    "mime_type": "text/plain",
    "sha256": "...",
    "category": "other",
    "created_at": "2026-03-27T16:00:00Z"
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
    "event_id": 1002
  }
}
```

---

## 6. Events

### GET `/v1/events?since_event_id=0&limit=50`

响应：

```json
{
  "ok": true,
  "data": {
    "events": [
      {
        "event_id": 1001,
        "event_type": "item_created",
        "item_id": "itm_xxx",
        "created_at": "2026-03-27T16:00:00Z",
        "payload": {}
      }
    ],
    "next_since_event_id": 1001
  }
}
```

### WS `/v1/events/ws`

- 使用相同 `Authorization` 令牌建立连接。
- 服务端推送事件类型：`item_created`、`item_deleted`、`file_ready`。

推送消息示例：

```json
{
  "event": "item_created",
  "accountId": "u_xxx",
  "timestamp": "2026-03-27T16:00:00Z",
  "eventId": 1001,
  "payload": {
    "itemId": "itm_xxx"
  }
}
```

---

## 7. Files

### POST `/v1/files/prepare-upload`

请求：

```json
{
  "fileName": "demo.txt",
  "fileSize": 1024,
  "mimeType": "text/plain",
  "sha256": "...",
  "category": "other"
}
```

响应：

```json
{
  "ok": true,
  "data": {
    "fileId": "file_xxx",
    "uploadUrl": "https://upload.mock/...",
    "uploadMethod": "PUT",
    "expiresAt": "2026-03-27T16:05:00Z",
    "category": "other"
  }
}
```

### POST `/v1/files/complete`

请求：

```json
{
  "fileId": "file_xxx",
  "etag": "etag_xxx",
  "sha256": "..."
}
```

响应：

```json
{
  "ok": true,
  "data": {
    "itemId": "itm_file_xxx",
    "fileId": "file_xxx",
    "ready": true,
    "category": "other"
  }
}
```

### POST `/v1/files/:fileId/prepare-download`

响应：

```json
{
  "ok": true,
  "data": {
    "fileId": "file_xxx",
    "fileName": "demo.txt",
    "fileSize": 1024,
    "downloadUrl": "https://download.mock/...",
    "expiresAt": "2026-03-27T16:10:00Z",
    "category": "other"
  }
}
```

### POST `/v1/files/cleanup`

请求：

```json
{
  "reason": "expired",
  "before_time": "2026-06-01T00:00:00Z",
  "category": "other"
}
```

响应：

```json
{
  "ok": true,
  "data": {
    "success": true,
    "reason": "expired",
    "removed": 3,
    "removedFileIds": ["file_1", "file_2"],
    "cleanedAt": "2026-06-01T00:00:10Z"
  }
}
```

---

## 8. Devices

### POST `/v1/devices/register`

请求：

```json
{
  "device_name": "Desktop Local",
  "platform": "macos",
  "client_version": "0.1.0"
}
```

响应：

```json
{
  "ok": true,
  "data": {
    "device": {
      "deviceId": "dev_xxx",
      "deviceName": "Desktop Local",
      "platform": "macos",
      "isActive": true,
      "lastSeenAt": "2026-03-27T16:00:00Z"
    }
  }
}
```

### POST `/v1/devices/heartbeat`

请求：

```json
{
  "device_id": "dev_xxx"
}
```

响应：

```json
{
  "ok": true,
  "data": {
    "deviceId": "dev_xxx",
    "acknowledgedAt": "2026-03-27T16:01:00Z"
  }
}
```

### GET `/v1/devices`

响应：

```json
{
  "ok": true,
  "data": {
    "devices": []
  }
}
```

### POST `/v1/devices/revoke`

请求：

```json
{
  "device_id": "dev_xxx"
}
```

响应：

```json
{
  "ok": true,
  "data": {
    "success": true,
    "revokedAt": "2026-03-27T16:02:00Z"
  }
}
```

---

## 9. 前端对接约定

- 桌面端应统一使用后端 `/v1/*` 路由，不再依赖 mock path。
- 事件连接应改为 `/v1/events/ws`。
- 文件 category 前端需透传；缺省时使用 `other`。

