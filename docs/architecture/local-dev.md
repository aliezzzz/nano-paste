# NanoPaste 本地联调（Mock / Real Backend）

本文档用于当前阶段的本地联调说明，覆盖：

- `mock-server -> desktop`
- `backend -> desktop`（切真实后端）

## 一、Mock 联调启动顺序

1. 启动 Mock Server

```bash
cd packages/mock-server
npm install
npm run dev
```

默认地址：

- HTTP: `http://localhost:3100`
- WS: `ws://localhost:3100/ws?accessToken=<token>`

2. 启动 Desktop（Web）

```bash
cd apps/desktop
npm install
npm run dev:web
```

默认页面：`http://127.0.0.1:1420`

## 二、桌面端切真实后端联调

按以下顺序执行：

### 1) 先启动 backend

```bash
cd apps/backend
go run ./cmd/server
```

默认后端地址：`http://localhost:8080`

### 2) 再启动 desktop

```bash
cd apps/desktop
npm install
npm run dev:web
```

### 3) base URL 从 mock 切到真实 backend

当前桌面端请求基地址写在 `apps/desktop/src/main.ts`：

```ts
const MOCK_BASE_URL = "http://localhost:3100";
```

联调真实后端时，将其改为：

```ts
const MOCK_BASE_URL = "http://localhost:8080";
```

说明：

- 切换后，桌面端的 HTTP 接口会从 mock 改为调用 backend 的 `/v1/*`。
- 当前桌面端 WS 连接仍使用 mock 风格路径（`/ws?accessToken=...`）；真实后端的 WS 路径为 `/v1/events/ws`。

## 本阶段可联调能力

- 文本发送：`POST /v1/items`
- 条目列表：`GET /v1/items` + `GET /v1/items/:itemId`
- 文件元数据模拟：`POST /v1/files/prepare-upload` + `POST /v1/files/complete`
- 文件下载地址模拟：`POST /v1/files/:fileId/prepare-download`
- WS 刷新：接收 `item_created` / `item_deleted` / `file_ready`

## 重要声明

- 当前仍为最小联调版本。
- 未实现真实系统剪贴板监听。
- 未实现真实拖拽上传/本地文件读写。
- 未实现真实文件传输（仅 mock 下载地址）。
