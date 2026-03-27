# NanoPaste Desktop（Mock 联调版）

本目录提供桌面端最小可运行联调流程，面向 `packages/mock-server`。

## 本地联调步骤

1. 启动 mock-server（先启动）：

   ```bash
   cd packages/mock-server
   npm install
   npm run dev
   ```

2. 启动 desktop（后启动）：

   ```bash
   cd apps/desktop
   npm install
   npm run dev:web
   ```

3. 打开页面后可直接进行以下操作：

   - 发送文本（调用 `POST /v1/items`）
   - 查看最近条目（调用 `GET /v1/items` + `GET /v1/items/:itemId`）
   - 点击“模拟上传完成”（调用 `POST /v1/files/prepare-upload` + `POST /v1/files/complete`）
   - 对文件条目点击“下载”（调用 `POST /v1/files/:fileId/prepare-download`）
   - WS 收到 `item_created` / `item_deleted` / `file_ready` 后自动刷新列表

## 说明

- 当前是 **Mock 联调版本**。
- 未实现真实系统剪贴板监听。
- 未实现真实拖拽上传与本地文件读写。
- 未实现真实文件传输（仅展示 mock 返回的下载地址）。
