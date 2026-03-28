# NanoPaste 前端缺口清单（Desktop）

本文档列出当前桌面前端对接真实后端前仍缺失/待修复的内容。

## 1. 必改项（影响联调）

1) API 基地址配置化
- 现状：在 `src/main.ts` 中硬编码 `MOCK_BASE_URL`。
- 目标：改为环境变量（例如 `VITE_API_BASE_URL`），开发默认指向 `http://localhost:8080`。

2) WebSocket 路径切换
- 现状：使用 mock 风格路径 `/ws?accessToken=...`。
- 目标：改为真实后端路径 `/v1/events/ws`，并保持 Bearer 鉴权一致。

3) Auth 字段兼容统一
- 现状：前端部分字段命名与后端兼容层可工作，但不统一。
- 目标：统一使用后端文档字段（`access_token`、`refresh_token`、`expires_in_seconds` 等），减少歧义。

4) 文件流程字段对齐
- 现状：文件流程能跑，但对 `category` 透传不完整。
- 目标：prepare-upload、列表筛选、cleanup 均支持 `category`（默认 `other`）。

## 2. 强烈建议（提高稳定性）

1) Token 生命周期管理
- 登录后保存 access/refresh，access 失效自动 refresh；refresh 失效自动回登录页。

2) Request 层统一封装
- 把 `fetch` 调用集中到 API client，统一错误处理、请求 ID 展示、重试策略。

3) 事件驱动的列表更新
- 当前收到事件后全量刷新列表；建议改为增量合并，降低抖动与请求量。

4) 设备标识持久化
- `X-Device-Id` 应稳定存储，避免每次运行被当成新设备。

## 3. 体验缺口（MVP 后续）

1) 真实剪贴板监听与回写
- 当前为手动输入/按钮模拟，尚未接系统剪贴板。

2) 真实文件上传/下载
- 当前下载 URL 为占位签名逻辑；后续接真实对象存储后补进度与失败重试。

3) 文件管理界面
- 增加按 `category`、时间、大小过滤与批量清理入口。

4) 连接状态与错误面板
- 增加 WS 断线重连状态、最近错误列表、请求 ID 复制能力。

## 4. 建议实施顺序

1. 基地址与 WS 路径改造
2. token 刷新与 API client 封装
3. category 全链路透传
4. 增量事件更新
5. 真实剪贴板与真实文件传输

