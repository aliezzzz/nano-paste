# NanoPaste Mock Server

最小可运行的 Mock 服务骨架（HTTP + WebSocket + 内存态数据），用于桌面端先联调，接口对齐 `packages/contracts/v1`。

## 启动

```bash
cd packages/mock-server
npm install
npm run dev
```

默认监听：

- HTTP: `http://localhost:3100`
- WS: `ws://localhost:3100/ws?accessToken=<mock_access_token>`

也可通过环境变量覆盖端口：

```bash
MOCK_SERVER_PORT=3200 npm run dev
```

## 已实现 Mock 能力

### 1) Auth

- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`

说明：仅最小 token 模拟，无复杂鉴权。`login` 会返回 `mock_access::...` 和 `mock_refresh::...`。

### 2) Items

- `POST /v1/items`（当前按 contracts v1，仅创建 text）
- `GET /v1/items`
- `GET /v1/items/:itemId`
- `DELETE /v1/items/:itemId`

### 3) Files

- `POST /v1/files/prepare-upload`
- `POST /v1/files/complete`
- `POST /v1/files/:fileId/prepare-download`

额外 mock 入口（用于“90天保留 + 主动清理”行为）：

- `POST /v1/files/cleanup`
  - 默认清理当前账号
  - body 传 `{ "scope": "global" }` 可模拟全局清理

### 4) Devices

- `POST /v1/devices/register`
- `POST /v1/devices/heartbeat`
- `GET /v1/devices`
- `POST /v1/devices/:deviceId/revoke`

### 5) WebSocket 事件广播

连接方式：

- `ws://localhost:3100/ws?accessToken=<accessToken>`

已实现事件（按 contracts v1）：

- `item_created`
- `item_deleted`
- `file_ready`

广播策略：同账号可见（same account only）。

## 内存态存储说明

- 所有数据仅存内存，进程重启即丢失
- 文件记录包含 `retentionUntil` mock 字段（90 天）
- 提供定时清理（每 10 分钟一次）+ 手动清理入口（`/v1/files/cleanup`）

## 快速联调建议

1. 先调用 `POST /v1/auth/login` 获取 access token
2. 后续调用在 header 带：`Authorization: Bearer <accessToken>`
3. WebSocket 用同一个 access token 建连，接收事件推送

## 声明

仅 Mock，无真实后端能力（无真实数据库、无真实对象存储、无生产级鉴权）。
