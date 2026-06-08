# NanoPaste Desktop

本目录是 NanoPaste 前端应用，使用 Vue 3、TypeScript、Pinia、UnoCSS 和 Tauri 2。同一套 Vue UI 当前用于 Web、Tauri 桌面端、Android 构建和 Chrome 扩展 popup。

## 本地 Web 联调

先启动真实后端：

```bash
cd apps/backend
go run ./cmd/server
```

再启动前端：

```bash
cd apps/desktop
pnpm install
pnpm run dev:web
```

默认后端地址为 `http://localhost:8080`。如需修改，在应用配置弹窗中填写后端地址；Chrome 扩展环境会写入 `chrome.storage`，其他环境会写入 `localStorage`。

## 常用命令

- `pnpm run dev:web`：启动 Web 开发环境
- `pnpm run build:web`：构建 Web 静态资源
- `pnpm run build:ext`：构建 Chrome 扩展产物
- `pnpm run dev`：启动 Tauri 桌面端开发环境
- `pnpm run build`：构建 Tauri 桌面端安装包
- `pnpm run typecheck`：执行 Vue/TypeScript 类型检查

## 当前能力

- 登录、刷新 token、登出
- 发送文本条目
- 上传文件并生成文件条目
- 查看、复制、下载、删除条目
- 收藏条目并按收藏优先排序
- 全局粘贴文本或文件到当前工作区
- Chrome 扩展右键菜单发送选中文本、链接、页面或图片

## Chrome 扩展（MV3）

构建命令：

```bash
cd apps/desktop
pnpm install
pnpm run build:ext
```

构建产物目录：`apps/desktop/dist-extension`

加载方式：打开 `chrome://extensions`，开启开发者模式，选择“加载已解压的扩展程序”，再选择 `dist-extension`。

## Android 打包配置（Tauri 2）

已补充 Android 相关脚本、签名流程与移动端兼容配置。

- `pnpm run android:init`：初始化 Android 工程骨架
- `pnpm run android:dev`：Android ARMv8 真机开发调试
- `pnpm run android:build`：构建 Android ARMv8 APK 安装包
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
