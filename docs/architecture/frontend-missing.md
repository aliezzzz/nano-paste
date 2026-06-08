# NanoPaste 前端缺口清单

本文档列出当前前端在接入真实 Go 后端后仍值得补齐的事项。早期 Mock、WebSocket、prepare-upload 流程已经不属于当前实现范围。

## 必改项

1. pnpm 基线验证
- 现状：仓库已经统一到 `pnpm`，构建链路需要保持可复现。
- 目标：持续使用 `pnpm install --frozen-lockfile`、`pnpm run typecheck`、`pnpm run build:web` 验证前端变更。

2. 契约字段继续收口
- 现状：前端兼容 `snake_case` 与 `camelCase` token 字段，后端 auth 响应仍使用 `snake_case`。
- 目标：明确 contracts 中 auth 字段命名策略，减少双字段兼容逻辑。

3. 配置来源说明
- 现状：Web/Tauri 使用 Pinia 持久化，Chrome 扩展使用 `chrome.storage`。
- 目标：补充配置优先级说明，尤其是 `VITE_DEFAULT_APP_API_BASE_URL` 与运行时配置的关系。

## 强烈建议

1. 文件管理能力
- 增加按 `category`、时间、大小过滤与批量清理入口。

2. 连接状态与错误面板
- 展示当前后端地址、最近请求错误、请求 ID 与重试入口。

3. 上传体验优化
- 增加更细的失败原因、取消上传、批量重试与大文件提示。

4. 端到端验证
- 增加最小 smoke 测试，覆盖登录、发送文本、上传文件、列表刷新和下载准备。

## 当前已完成

- API 基地址可在运行时配置。
- Request 层统一封装 axios，支持 access token 自动刷新。
- 文件上传使用真实 `POST /v1/files/upload`。
- 下载使用 `POST /v1/files/:fileId/prepare-download` 后触发直链下载。
- Chrome 扩展可以通过右键菜单发送文本、链接、页面和图片。
