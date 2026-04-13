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

## Chrome 扩展（MV3）

构建命令：

```bash
cd apps/desktop
npm install
npm run build:ext
```

构建产物目录：`apps/desktop/dist-extension`

加载方式：打开 `chrome://extensions` -> 开启开发者模式 -> 选择“加载已解压的扩展程序” -> 选择 `dist-extension`。

## Android 打包配置（Tauri 2）

已补充 Android 相关脚本、签名流程与移动端兼容配置。

- `npm run android:init`：初始化 Android 工程骨架
- `npm run android:dev`：Android ARMv8 真机开发调试
- `npm run android:build`：构建 Android ARMv8 APK 安装包
- `build-android-arm64.bat`：Windows 下推荐使用的一键构建入口

说明：

- 当前仅补齐项目配置，Android SDK/NDK/JDK 等构建环境需在本机单独安装。
- 当前仅面向 ARMv8（`aarch64 / arm64-v8a`）设备构建，不包含 armv7/x86/x86_64。
- Android 图标以 `src-tauri/icons/android` 为唯一来源，`android:init/dev/build` 会自动同步到 `src-tauri/gen/android/app/src/main/res`。
- 桌面端托盘与关闭最小化逻辑已做移动端条件编译隔离，避免 Android 构建时引入桌面专属能力。
- Android 端不要使用 `localhost` 作为后端地址，建议填写可从手机访问的服务地址。
- 正式可分发产物为 `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk`。
- 不要分发 `*-unsigned.apk`，那是未签名包，无法直接安装。
- 本地签名和构建收敛说明见 `docs/architecture/android-private-build.md`。
