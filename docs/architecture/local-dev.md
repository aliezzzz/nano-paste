# NanoPaste 本地联调

本文档说明当前真实后端与前端的本地联调方式。早期 Mock Server / WebSocket 联调流程已经不属于当前实现范围。

## 启动后端

```bash
cd apps/backend
go run ./cmd/server
```

默认后端地址：`http://localhost:8080`。

后端启动时会自动创建 SQLite 数据库与核心表，默认数据目录为 `apps/backend/data`。

## 启动 Web 前端

```bash
cd apps/desktop
pnpm install
pnpm run dev:web
```

前端默认连接 `http://localhost:8080`。如需连接其他地址，打开应用配置弹窗并填写可访问的后端 Base URL。

## 构建 Web 并由后端托管

```bash
cd apps/desktop
pnpm run build:web
```

```bash
cd apps/backend
go run ./cmd/server
```

访问 `http://localhost:8080/`。后端会托管 `apps/desktop/dist`，并保留 `/v1/*` 与 `/health` 路由。

## 可联调能力

- 登录、刷新 token、登出
- 文本发送：`POST /v1/items`
- 条目列表：`GET /v1/items`
- 条目删除：`DELETE /v1/items/:itemId`
- 收藏切换：`POST /v1/items/:itemId/favorite`
- 文件上传：`POST /v1/files/upload`
- 文件下载准备：`POST /v1/files/:fileId/prepare-download`
- 文件清理：`POST /v1/files/cleanup`

## Chrome 扩展联调

```bash
cd apps/desktop
pnpm run build:ext
```

打开 `chrome://extensions`，开启开发者模式，加载 `apps/desktop/dist-extension`。扩展默认连接 `http://localhost:8080`，可在 popup 配置弹窗中修改后端地址。
