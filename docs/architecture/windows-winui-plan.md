# NanoPaste WinUI Windows 端计划

本文档用于规划一个独立的 Windows 原生端：`apps/windows-winui`。该端不复用现有 Vue/Tauri UI，而是使用 WinUI 3、Windows App SDK 和 C# 实现 Windows 最佳体验。

## 1. 目标

- 新增独立 Windows 原生端，不替代现有 `apps/desktop`。
- 复用当前 Go 后端 HTTP API。
- 使用 WinUI 3 原生能力强化 Windows 体验：托盘、全局快捷键、剪贴板监听、Windows 通知、MSIX 打包。
- 使用 TDD 开发：先写测试，再实现，再重构。
- 使用 `microsoft/win-dev-skills` 辅助 WinUI 3 / XAML / Windows App SDK 开发。

## 2. 端定位

| 端 | 定位 |
|---|---|
| Web / Vue | 通用访问与管理 |
| Tauri | 跨平台桌面端 |
| Chrome 扩展 | 浏览器右键发送 |
| WinUI | Windows 原生效率端，主打托盘、快捷键、剪贴板和通知 |

## 3. Windows 环境准备

在 Windows 开发机上准备：

| 工具 | 用途 | 验证命令 |
|---|---|---|
| Git | 克隆仓库和 skills | `git --version` |
| .NET SDK 8+，推荐 10 | WinUI 构建 | `dotnet --list-sdks` |
| WinApp CLI 0.3+ | 运行、自动化、打包 | `winapp --version` |
| WinUI 3 templates | 创建 WinUI 项目 | `dotnet new list winui` |
| Developer Mode | 运行 packaged app | Windows 设置中启用 |
| Visual Studio + WinUI workload | 可选，提升 XAML 诊断 | Visual Studio Installer |

推荐检查命令：

```powershell
git --version
dotnet --list-sdks
winapp --version
dotnet new list winui
```

## 4. 克隆 win-dev-skills

在 Windows 环境执行：

```powershell
cd C:\dev\tools
git clone https://github.com/microsoft/win-dev-skills.git
cd win-dev-skills
git tag
```

该项目仍是 preview。建议固定 release tag，例如：

```powershell
git checkout v0.3.0
```

如果没有合适 tag，可先使用 `main`，但开发前记录当前 commit：

```powershell
git rev-parse HEAD
```

## 5. 接入 Windows opencode skills

当前计划采用“克隆下载 + 本地 skill 接入”的方式。

需要接入的 skill 目录：

```text
plugins/winui/skills/winui-setup
plugins/winui/skills/winui-dev-workflow
plugins/winui/skills/winui-design
plugins/winui/skills/winui-ui-testing
plugins/winui/skills/winui-packaging
plugins/winui/skills/winui-code-review
```

建议流程：

1. 在 Windows 上确认 opencode 的本地 skills 目录。
2. 将以上 skill 目录复制或链接到 opencode skills 目录。
3. 新开 opencode 会话，确认可加载 `winui-design`、`winui-dev-workflow` 等 skill。
4. 先运行 `winui-setup` 做环境检查。
5. 后续按阶段加载对应 skill。

注意：`winui-design` 中的 `winui-search.exe` 和 workflow 中的 PowerShell 脚本只在 Windows 环境有实际意义。

## 6. 建议项目结构

```text
apps/windows-winui/
  NanoPaste.WinUI.sln
  src/
    NanoPaste.WinUI/
      App.xaml
      MainWindow.xaml
      Package.appxmanifest
      Views/
      ViewModels/
      Services/
      Models/
    NanoPaste.WinUI.Tests/
  docs/
    README.md
```

推荐分层：

```text
Views        XAML 页面和控件
ViewModels   页面状态、命令、验证逻辑
Services     API、剪贴板、快捷键、托盘、通知、本地设置
Models       DTO、领域模型、UI model
```

## 7. 技术选型

| 模块 | 推荐 |
|---|---|
| UI | WinUI 3 + Windows App SDK |
| 语言 | C# |
| 架构 | MVVM |
| MVVM 库 | CommunityToolkit.Mvvm |
| HTTP | HttpClient |
| JSON | System.Text.Json |
| 本地设置 | ApplicationData.Current.LocalSettings 或 JSON 文件 |
| 文件选择 | WinUI FilePicker |
| 通知 | AppNotification |
| 托盘 | Windows App SDK 能力或 Win32 interop |
| 快捷键 | Win32 RegisterHotKey |
| 剪贴板 | Windows clipboard APIs |
| 单元测试 | xUnit 或 MSTest，优先测试 ViewModel / Service |

## 8. API 对接范围

WinUI 端复用当前后端接口：

- `GET /health`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `POST /v1/items`
- `GET /v1/items`
- `DELETE /v1/items/:itemId`
- `POST /v1/items/:itemId/favorite`
- `POST /v1/files/upload`
- `POST /v1/files/:fileId/prepare-download`
- `GET /v1/files/download/:fileId?access_token=...`
- `POST /v1/files/cleanup`

WinUI 端需要单独定义 C# DTO，不直接复用 TypeScript contracts。

### 8.1 C# DTO 清单

建议 DTO 使用 `System.Text.Json.Serialization.JsonPropertyName` 精确匹配后端字段。API payload 字段保持后端格式，ViewModel 内部状态可转为 C# 语义化属性。

```csharp
public sealed record ApiResponse<T>(
    [property: JsonPropertyName("ok")] bool Ok,
    [property: JsonPropertyName("data")] T? Data,
    [property: JsonPropertyName("error")] ApiError? Error);

public sealed record ApiError(
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("requestId")] string? RequestId);

public sealed record LoginRequest(
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("password")] string Password);

public sealed record TokenPair(
    [property: JsonPropertyName("access_token")] string AccessToken,
    [property: JsonPropertyName("refresh_token")] string RefreshToken,
    [property: JsonPropertyName("expires_in_seconds")] int ExpiresInSeconds);

public sealed record LoginResponse(
    [property: JsonPropertyName("user_id")] string UserId,
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("tokens")] TokenPair Tokens);

public sealed record RefreshRequest(
    [property: JsonPropertyName("refresh_token")] string RefreshToken);

public sealed record RefreshResponse(
    [property: JsonPropertyName("tokens")] TokenPair Tokens);

public sealed record LogoutRequest(
    [property: JsonPropertyName("refresh_token")] string RefreshToken,
    [property: JsonPropertyName("all_sessions")] bool AllSessions = false);
```

Items / files DTO：

```csharp
public sealed record CreateTextItemRequest(
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("content")] string Content,
    [property: JsonPropertyName("title")] string? Title,
    [property: JsonPropertyName("tags")] IReadOnlyList<string>? Tags,
    [property: JsonPropertyName("client_event_id")] string ClientEventId);

public sealed record ItemDetail(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("title")] string? Title,
    [property: JsonPropertyName("content")] string? Content,
    [property: JsonPropertyName("fileId")] string? FileId,
    [property: JsonPropertyName("fileName")] string? FileName,
    [property: JsonPropertyName("fileSize")] long? FileSize,
    [property: JsonPropertyName("mimeType")] string? MimeType,
    [property: JsonPropertyName("tags")] IReadOnlyList<string>? Tags,
    [property: JsonPropertyName("isFavorite")] bool IsFavorite,
    [property: JsonPropertyName("createdAt")] string CreatedAt);

public sealed record ListItemsResponse(
    [property: JsonPropertyName("items")] IReadOnlyList<ItemDetail> Items,
    [property: JsonPropertyName("page")] PageMeta Page);

public sealed record PageMeta(
    [property: JsonPropertyName("nextCursor")] string? NextCursor,
    [property: JsonPropertyName("hasMore")] bool HasMore);

public sealed record UploadFileResponse(
    [property: JsonPropertyName("itemId")] string ItemId,
    [property: JsonPropertyName("fileId")] string FileId,
    [property: JsonPropertyName("ready")] bool Ready,
    [property: JsonPropertyName("category")] string Category);

public sealed record PrepareDownloadResponse(
    [property: JsonPropertyName("fileId")] string FileId,
    [property: JsonPropertyName("fileName")] string FileName,
    [property: JsonPropertyName("fileSize")] long FileSize,
    [property: JsonPropertyName("downloadUrl")] string DownloadUrl,
    [property: JsonPropertyName("expiresAt")] string ExpiresAt,
    [property: JsonPropertyName("category")] string Category);
```

### 8.2 ApiClient 设计

建议接口：

```csharp
public interface INanoPasteApiClient
{
    Task<bool> CheckHealthAsync(Uri baseUri, CancellationToken cancellationToken = default);
    Task<LoginResponse> LoginAsync(Uri baseUri, string username, string password, CancellationToken cancellationToken = default);
    Task<RefreshResponse> RefreshAsync(Uri baseUri, string refreshToken, CancellationToken cancellationToken = default);
    Task LogoutAsync(Uri baseUri, string refreshToken, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ItemDetail>> ListItemsAsync(Uri baseUri, string accessToken, int limit = 50, CancellationToken cancellationToken = default);
    Task<ItemDetail> CreateTextItemAsync(Uri baseUri, string accessToken, string content, string? title, IReadOnlyList<string>? tags, CancellationToken cancellationToken = default);
    Task DeleteItemAsync(Uri baseUri, string accessToken, string itemId, CancellationToken cancellationToken = default);
    Task SetFavoriteAsync(Uri baseUri, string accessToken, string itemId, bool favorite, CancellationToken cancellationToken = default);
    Task<UploadFileResponse> UploadFileAsync(Uri baseUri, string accessToken, string filePath, string category, IProgress<double>? progress, CancellationToken cancellationToken = default);
    Task<PrepareDownloadResponse> PrepareDownloadAsync(Uri baseUri, string accessToken, string fileId, CancellationToken cancellationToken = default);
}
```

实现约束：

- 所有需要鉴权的请求都设置 `Authorization: Bearer <access_token>`。
- 统一解析 `{ ok, data, error }` envelope。
- API 错误抛出自定义 `NanoPasteApiException`，包含 `StatusCode`、`Code`、`Message`、`RequestId`。
- `RefreshAsync` 只发送 `refresh_token`，不发送兼容字段。
- `UploadFileAsync` 使用 `MultipartFormDataContent`，字段名为 `file` 和 `category`。
- `PrepareDownloadAsync` 返回相对 `downloadUrl` 时，由调用方拼接后端 Base URL。

## 9. UI 设计方向

遵循 `winui-design` skill 的规则：

- 主窗口使用 `NavigationView`。
- 搜索使用 `AutoSuggestBox`。
- 历史和收藏列表使用 `ListView`。
- 上传队列使用 `ListView` + `ProgressBar`。
- 设置页使用 `SettingsCard` 风格。
- 错误提示使用 `InfoBar`。
- 确认删除使用 `ContentDialog`。
- 系统通知使用 `AppNotification`。
- 资源使用 `{ThemeResource}`，支持 Light / Dark / HighContrast。
- Icon-only 按钮必须设置 `AutomationProperties.Name` 和 `AutomationProperties.AutomationId`。

建议导航：

```text
发送
历史
收藏
上传
设置
```

建议窗口尺寸：约 `1100 x 760`，最终按 WinUI 内容和 DPI 计算。

## 10. TDD 开发阶段

| 阶段 | 先写测试 | 再实现 |
|---|---|---|
| 10.1 API Client | mock HTTP 测 login / refresh / list / upload | `NanoPasteApiClient` |
| 10.2 Auth | 测 token 保存、刷新、登出 | `AuthSessionStore`、`LoginViewModel` |
| 10.3 Items | 测列表、搜索、收藏、标签、批量删除 | `WorkspaceViewModel` |
| 10.4 Upload | 测排队、上传中、失败、重试、取消 | `UploadQueueViewModel` |
| 10.5 Settings | 测后端地址校验、测试连接 | `SettingsViewModel` |
| 10.6 Clipboard | mock service 测捕获开关、文本/文件捕获 | `ClipboardCaptureService` |
| 10.7 Hotkey | mock service 测快捷键触发发送 | `GlobalHotkeyService` |
| 10.8 Tray / Notification | mock service 测托盘状态、通知触发 | `TrayService`、`NotificationService` |
| 10.9 UI Automation | 用 `winui-ui-testing` 做关键交互 | UI 自动化脚本 |

### 10.10 具体测试用例清单

API Client：

- `CheckHealthAsync_WhenHealthOk_ReturnsTrue`
- `LoginAsync_WhenEnvelopeOk_ReturnsSession`
- `LoginAsync_WhenApiError_ThrowsNanoPasteApiException`
- `RefreshAsync_SendsRefreshTokenSnakeCaseOnly`
- `ListItemsAsync_AddsBearerTokenAndParsesTags`
- `CreateTextItemAsync_SendsTagsAndClientEventId`
- `UploadFileAsync_SendsMultipartFileAndCategory`
- `PrepareDownloadAsync_ParsesRelativeDownloadUrl`

Auth / Settings ViewModel：

- `LoginViewModel_LoginSuccess_SavesSessionAndNavigates`
- `LoginViewModel_LoginFailure_ShowsActionableError`
- `SettingsViewModel_TestConnectionSuccess_ShowsOnlineState`
- `SettingsViewModel_InvalidUrl_DisablesSave`
- `SettingsViewModel_SavePersistsBackendAddress`

Workspace ViewModel：

- `WorkspaceViewModel_LoadItems_GroupsFavoritesAndHistory`
- `WorkspaceViewModel_Search_FiltersByTitleContentFileNameAndTags`
- `WorkspaceViewModel_ToggleFavorite_UpdatesLocalStateAfterApiSuccess`
- `WorkspaceViewModel_BatchDelete_DeletesSelectedItemsAndClearsSelection`
- `WorkspaceViewModel_CopyText_ShowsNotification`

Upload Queue ViewModel：

- `UploadQueueViewModel_Enqueue_AddsQueuedItems`
- `UploadQueueViewModel_UploadSuccess_MarksDoneAndRefreshesItems`
- `UploadQueueViewModel_UploadFailure_KeepsRetryableError`
- `UploadQueueViewModel_CancelQueuedUpload_MarksCancelled`
- `UploadQueueViewModel_ClearFinished_RemovesDoneFailedAndCancelled`

Windows Integration Services：

- `ClipboardCaptureService_WhenDisabled_DoesNotCapture`
- `ClipboardCaptureService_TextChanged_AddsPendingText`
- `GlobalHotkeyService_HotkeyPressed_InvokesSendCommand`
- `TrayService_ExitCommand_ShutsDownApplication`
- `NotificationService_SendSuccess_ShowsAppNotification`

## 11. 首版功能范围

| 优先级 | 功能 |
|---|---|
| P0 | 后端地址配置 + 测试连接 |
| P0 | 登录 / 登出 / refresh token |
| P0 | 发送文本 |
| P0 | 上传文件 |
| P0 | 历史列表 |
| P0 | 搜索 / 收藏 / 标签 |
| P1 | 上传队列任务中心 |
| P1 | 批量删除 |
| P1 | 托盘常驻 |
| P1 | 全局快捷键 |
| P1 | 剪贴板自动捕获开关 |
| P2 | AppNotification |
| P2 | MSIX 打包签名 |
| P2 | 开机自启动 |

## 12. 构建和运行规则

遵循 `winui-dev-workflow`：

- 不直接运行 packaged `.exe`。
- 不设置 `<WindowsPackageType>None` 逃避 packaged app 运行问题。
- 不删除 `Package.appxmanifest`。
- 不使用 `AnyCPU`，使用 `x64` 或 `ARM64`。
- 优先使用 `BuildAndRun.ps1` 或 `winapp run`。

建议验证命令：

```powershell
dotnet build
.\BuildAndRun.ps1 -SkipRun
.\BuildAndRun.ps1
```

## 13. 打包发布规则

遵循 `winui-packaging`：

```powershell
.\BuildAndRun.ps1 /p:Configuration=Release -SkipRun
winapp cert generate --manifest .
winapp cert install .\devcert.pfx
winapp package <build-output-dir> --cert .\devcert.pfx
Add-AppxPackage .\NanoPaste.msix
```

生产签名必须使用带 timestamp 的证书签名流程。

## 14. Windows opencode 启动提示词

在 Windows 环境准备好后，可将下面提示词发给 opencode：

```text
你现在在 Windows 环境中。请使用本地克隆的 microsoft/win-dev-skills 里的 WinUI skills，按 TDD 开发 NanoPaste 的独立 WinUI 3 Windows 端。

目标：
- 在当前仓库新增 apps/windows-winui
- 使用 C# + WinUI 3 + Windows App SDK + MVVM
- 复用现有 Go 后端 HTTP API
- 先写测试，再实现
- UI 使用 Fluent Design，支持 Light/Dark/HighContrast
- 不直接运行 exe，使用 winapp run 或 BuildAndRun.ps1
- 不使用 AnyCPU
- 不修改现有 Vue/Tauri 端，除非文档需要同步

第一步：
1. 加载 winui-setup / winui-dev-workflow / winui-design
2. 检查 dotnet、winapp、WinUI templates、Developer Mode
3. 如果环境不满足，停止并报告缺失项
4. 如果满足，先生成详细实施计划，不要立刻写代码
```

## 15. 当前 macOS 环境可做的准备

- 维护本计划文档。
- 补齐后端 API 文档。
- 约定 WinUI DTO 字段和现有 API 对齐。
- 规划 `apps/windows-winui` 的目录和测试策略。
- 不在 macOS 环境尝试构建或运行 WinUI 3。
