# NanoPaste

NanoPaste 是一个轻量的文本与文件中转工具，当前已经具备真实后端、多端前端和私有化部署能力。

## 当前形态

- `apps/backend`：Go 1.22 + SQLite 后端，提供登录、文本条目、话题分组、文件上传下载、收藏与清理接口，并可托管 Web 静态资源。
- `apps/desktop`：Vue 3 + TypeScript + Pinia + UnoCSS 前端，同一套界面支持 Tauri 桌面端、Web、Android 构建和 Chrome 扩展 popup。
- `apps/windows-winui`：规划中的独立 WinUI 3 Windows 原生端，详见 [`docs/architecture/windows-winui-plan.md`](docs/architecture/windows-winui-plan.md)。
- `packages/contracts`：前后端共享的 TypeScript v1 接口契约。
- `build`：Docker 构建与 Compose 部署文件，镜像内包含后端二进制与 Web 静态资源。
- `docs`：架构与 API 文档。

## 常用命令

### 后端

```bash
cd apps/backend
go run ./cmd/server
go test ./...
go build ./...
```

默认监听 `http://localhost:8080`，默认 SQLite 数据库为 `apps/backend/data/nanopaste.db`。

### 前端

```bash
cd apps/desktop
pnpm install
pnpm run dev:web
pnpm run build:web
pnpm run build:ext
pnpm run typecheck
```

### Docker 部署

```bash
cp build/.env.example build/.env
bash build/docker-build.sh
docker compose -f build/docker-compose.yml up -d
```

Windows 请在 Git Bash 中执行上述命令；WSL 可直接执行同一组命令。

部署前请修改 `build/.env` 中的 `JWT_SECRET`。

## 当前接口范围

- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `POST /v1/items`
- `GET /v1/items`
- `DELETE /v1/items/:itemId`
- `POST /v1/items/:itemId/favorite`
- `PUT|POST /v1/items/:itemId/topic`
- `GET /v1/topics`
- `POST /v1/files/upload`
- `POST /v1/files/:fileId/prepare-download`
- `GET /v1/files/download/:fileId?access_token=...`
- `POST /v1/files/cleanup`
- `GET /health`

说明：早期文档中提到的 Mock Server、devices、events、WebSocket 同步机制已经不属于当前实现范围。

## 话题与标签

- 当前产品以 `topic` 作为主要组织方式：每个条目最多归属一个话题，前端通过侧边栏话题列表进行分组筛选。
- `tags` 是早期多标签能力，数据结构和旧条目展示暂时保留，用于兼容历史数据和搜索；新建文本的前端入口不再暴露标签输入。
