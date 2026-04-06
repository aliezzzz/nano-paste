# AGENTS 指南（my-todolist）

本文件面向在此仓库内工作的 agentic coding agents。
目标：快速了解项目结构、可执行命令、代码风格和提交前检查。

## 0. 仓库结构与现状

- 多应用仓库，主要包含：
  - `apps/backend`：Go 1.22 + SQLite 的 HTTP/WS 后端。
  - `apps/desktop`：Tauri + Vite + Vue 3 + TypeScript + UnoCSS 桌面端（可 `dev:web`）。
  - `packages/contracts`：前后端共享 TypeScript 协议类型（`v1/*`）。
- 当前未发现统一任务编排（无根 `package.json` 脚本、无 Makefile）。
- 当前未发现统一 lint/format 配置（如 ESLint/Prettier/golangci）。
- 当前测试文件很少或没有，命令以“可执行标准”优先。

## 1. 外部规则文件（Cursor / Copilot）

- 已检查 `.cursor/rules/`：未发现规则文件。
- 已检查 `.cursorrules`：未发现文件。
- 已检查 `.github/copilot-instructions.md`：未发现文件。
- 结论：当前以仓库内现有代码风格 + 本文档规则为准。

## 2. 常用命令（Build / Lint / Test）

### 2.1 Backend（Go）

在 `apps/backend` 执行：

- 启动服务：`go run ./cmd/server`
- 构建检查：`go build ./...`
- 全量测试：`go test ./...`
- 包级测试：`go test ./internal/items`
- 单测函数（重点）：`go test ./internal/items -run '^TestCreateItem$' -v`
- 覆盖率（可选）：`go test ./... -cover`
- 基础静态检查：`go vet ./...`
- 代码格式化：`gofmt -w ./cmd ./internal`

### 2.2 Desktop（Tauri + Vite + TS）

在 `apps/desktop` 执行：

- 安装依赖：`npm install`
- Web 开发：`npm run dev:web`
- Web 构建：`npm run build:web`
- Tauri 开发：`npm run dev`
- Tauri 打包：`npm run build`
- 仅构建可执行文件（跳过安装包）：`npm run build:exe`
- Android 初始化：`npm run android:init`
- Android 开发：`npm run android:dev`
- Android 打包：`npm run android:build`

补充：以上 Android 命令会先执行 `scripts/android-enable-cleartext.mjs`，自动将 `src-tauri/gen/android/app/build.gradle.kts` 中 `usesCleartextTraffic` 设为 `true`（若该文件存在），用于 HTTP 明文后端联调与打包可用性。
- 类型检查（lint 替代）：`npx tsc --noEmit`

说明：`apps/desktop/package.json` 当前没有 `test`/`lint` 脚本。

补充说明：

- 当前桌面端 Web UI 已迁移为 Vue 组件架构，桥接层位于 `src/bridge/`。
- 生成的桌面应用默认通过 `tauri.conf.json` 注入 `additionalBrowserArgs` 禁用 GPU（用于降低 WebView2 内存占用）。

## 3. 单测命令速查（重点）

当前稳定可用的是 Go 测试命令：

- 单个测试函数：`go test ./path/to/pkg -run '^TestName$' -v`
- 运行一组匹配测试：`go test ./path/to/pkg -run 'TestAuth|TestRefresh' -v`
- 关闭缓存复现问题：`go test ./path/to/pkg -run '^TestName$' -count=1 -v`

当前 TypeScript 端（`apps/desktop`）暂无标准测试脚本；若新增测试框架，必须补充本节。

## 4. 通用代码风格

- 优先遵循“现有文件风格”，不要在无关改动中统一格式。
- 小步修改：仅修改任务直接相关文件与逻辑。
- 避免无意义重命名、目录挪动、大规模格式化。
- 新增代码优先可读性，避免过度抽象。
- 注释只解释“为什么”，少写“代码在做什么”。

## 5. Go 规范（apps/backend）

### 5.1 导入与格式

- 以 `gofmt` 结果为准。
- import 分组遵循 Go 默认：标准库 / 第三方 / 本项目。
- 不手动对齐，不引入与当前文件冲突的格式习惯。

### 5.2 结构与职责

- 保持函数/struct 小而清晰。
- 延续已有 `handler -> repository` 分层职责。
- 业务错误走 `error` 返回，不用 panic 分支控制。
- HTTP 响应统一复用 `internal/common`。

### 5.3 命名

- 导出符号：PascalCase；非导出：camelCase。
- 错误变量统一 `err`；哨兵错误 `errXxx`。
- handler 方法命名倾向动词：`create/list/detail/delete`。

### 5.4 错误处理

- 每次 I/O/DB 调用后立即检查 `err`。
- 包装底层错误使用 `%w`：`fmt.Errorf("context: %w", err)`。
- HTTP 层统一通过 `common.WriteError` 返回标准错误结构。
- 鉴权失败返回 `UNAUTHORIZED`，参数问题返回 `VALIDATION_ERROR`。

## 6. TypeScript 规范（desktop + contracts）

### 6.1 导入与模块

- 保持子项目现有风格：
  - `apps/desktop`：双引号 + 分号。
  - `packages/contracts`：类型声明优先，保持简洁导出。
- 类型导入优先 `import type`。
- 导入顺序建议：外部依赖 -> 内部模块，组间空一行。
- `apps/desktop` 前端界面层优先使用 Vue 组件与组合式状态；避免回退到字符串模板拼接。

### 6.2 类型与接口

- `apps/desktop` 开启 `strict`，禁止随意引入 `any`。
- 导出函数与复杂分支优先显式返回类型。
- API 请求/响应优先复用 `packages/contracts` 类型。
- 可空值先收窄再使用，减少非空断言。
- 浏览器端尽量避免手写 DOM API（如 `document.querySelector` / `innerHTML`）；优先通过 Vue 模板和响应式状态驱动 UI。

### 6.3 命名

- 变量/函数：camelCase。
- 类型/类/接口：PascalCase。
- 常量：沿用文件既有风格；跨模块配置常量可全大写（如 `API_BASE_URL`）。
- 布尔变量优先 `is/has/can/should` 前缀。

### 6.4 错误处理

- `catch` 中优先转可读错误信息（如 `toErrorMessage`）。
- 网络错误统一由 `ApiClient` / `ApiRequestError` 承接。
- 不要静默吞错；若有意忽略，需体现明确意图。

## 7. API 与数据约定

- HTTP API 响应统一结构：`{ ok, data?, error? }`。
- 透传并保留 `request_id`（header/context 链路）。
- 路由分层保持：`/v1/auth/*` 与 `/v1/*`。
- 新增字段优先向后兼容，避免破坏 contracts。

## 8. 提交前最小检查

- 确认只改任务相关文件，无临时代码/调试输出。
- Backend 改动至少执行：`go build ./...`、`go test ./...`。
- Desktop 改动至少执行：`npm run build:web`、`npx tsc --noEmit`。

## 9. 文档维护要求

- 新增或修改 build/lint/test 命令时，必须同步更新本文件。
- 新增 Cursor/Copilot 规则文件时，必须在“外部规则”节补充摘要。
- 引入测试框架后，必须补充“单个测试”的准确运行示例。
