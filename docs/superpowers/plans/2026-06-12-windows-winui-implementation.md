# Windows WinUI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an independent `apps/windows-winui` Windows native client for NanoPaste after the WinUI toolchain is installed and verified.

**Architecture:** The WinUI client is a separate app that reuses the existing Go HTTP API but does not reuse the Vue/Tauri UI. It uses MVVM, small service interfaces, C# DTOs that match the backend JSON exactly, and fake services in tests before real Windows integrations.

**Tech Stack:** C#, WinUI 3, Windows App SDK, CommunityToolkit.Mvvm, HttpClient, System.Text.Json, xUnit or MSTest, WinApp CLI.

---

## Scope Gate

This plan must not be executed until these commands pass in a new PowerShell session:

```powershell
git --version
dotnet --list-sdks
winapp --version
dotnet new list winui
```

Expected environment:

- Git is available.
- `.NET SDK` is 8.0 or newer, preferably 10.
- `winapp` is 0.3 or newer.
- WinUI 3 C# templates are listed by `dotnet new list winui`.
- Developer Mode is enabled.
- Local WinUI skills can be loaded: `winui-setup`, `winui-dev-workflow`, `winui-design`.

If any item fails, stop and fix the environment before creating code.

## File Structure

Create these paths only after the scope gate passes:

- Create: `apps/windows-winui/NanoPaste.WinUI.sln` for the solution.
- Create: `apps/windows-winui/BuildAndRun.ps1` for packaged build/run workflow.
- Create: `apps/windows-winui/src/NanoPaste.WinUI/` for the WinUI app.
- Create: `apps/windows-winui/src/NanoPaste.WinUI.Tests/` for unit tests.
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Models/ApiDtos.cs` for API envelopes, errors, auth, items, files DTOs.
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Services/NanoPasteApiClient.cs` for HTTP calls.
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Services/AuthSessionStore.cs` for local session storage.
- Create: `apps/windows-winui/src/NanoPaste.WinUI/ViewModels/SettingsViewModel.cs` for backend URL and health check state.
- Create: `apps/windows-winui/src/NanoPaste.WinUI/ViewModels/LoginViewModel.cs` for login/logout flow.
- Create: `apps/windows-winui/src/NanoPaste.WinUI/ViewModels/WorkspaceViewModel.cs` for history, send text, search, favorite, delete.
- Create: `apps/windows-winui/src/NanoPaste.WinUI/ViewModels/UploadQueueViewModel.cs` for upload queue state.
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Views/` for WinUI pages and controls.

## Task 1: Environment Gate

**Files:**
- Modify: none

- [ ] **Step 1: Verify installed tools**

Run:

```powershell
git --version
dotnet --list-sdks
winapp --version
dotnet new list winui
```

Expected: all commands return versions or template listings. If `dotnet` or `winapp` is not recognized, do not continue.

- [ ] **Step 2: Verify Developer Mode**

Run:

```powershell
Get-ItemProperty -LiteralPath "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" | Select-Object AllowDevelopmentWithoutDevLicense
```

Expected: `AllowDevelopmentWithoutDevLicense` is `1`.

- [ ] **Step 3: Verify local WinUI skills**

Start a fresh agent session and load `winui-setup`, `winui-dev-workflow`, and `winui-design`.

Expected: each skill loads successfully. If not, install or link `microsoft/win-dev-skills` first.

## Task 2: Scaffold Solution

**Files:**
- Create: `apps/windows-winui/NanoPaste.WinUI.sln`
- Create: `apps/windows-winui/BuildAndRun.ps1`
- Create: `apps/windows-winui/src/NanoPaste.WinUI/`
- Create: `apps/windows-winui/src/NanoPaste.WinUI.Tests/`

- [ ] **Step 1: Create solution and projects**

Use the WinUI templates from the verified environment. Create a packaged WinUI 3 C# project and a test project under `apps/windows-winui/src`.

Expected: solution contains app and test projects. The app project keeps `Package.appxmanifest` and targets `x64`.

- [ ] **Step 2: Add build helper**

Copy the `BuildAndRun.ps1` helper pattern from `winui-dev-workflow` into `apps/windows-winui/BuildAndRun.ps1`.

Expected: the helper builds packaged app output and supports `-SkipRun`.

- [ ] **Step 3: Build without running**

Run from `apps/windows-winui`:

```powershell
dotnet build
.\BuildAndRun.ps1 -SkipRun
```

Expected: both commands pass. Do not directly run the generated `.exe`.

## Task 3: API DTOs and ApiClient

**Files:**
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Models/ApiDtos.cs`
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Services/INanoPasteApiClient.cs`
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Services/NanoPasteApiClient.cs`
- Test: `apps/windows-winui/src/NanoPaste.WinUI.Tests/NanoPasteApiClientTests.cs`

- [ ] **Step 1: Write failing API client tests**

Cover these behaviors:

- `CheckHealthAsync_WhenHealthOk_ReturnsTrue`
- `LoginAsync_WhenEnvelopeOk_ReturnsSession`
- `LoginAsync_WhenApiError_ThrowsNanoPasteApiException`
- `RefreshAsync_SendsRefreshTokenSnakeCaseOnly`
- `ListItemsAsync_AddsBearerTokenAndKeepsPagination`
- `CreateTextItemAsync_ParsesCreateItemResponseItem`
- `UploadFileAsync_SendsMultipartFileAndCategory`
- `PrepareDownloadAsync_ParsesRelativeDownloadUrl`

Run:

```powershell
dotnet test .\src\NanoPaste.WinUI.Tests\NanoPaste.WinUI.Tests.csproj
```

Expected: tests fail because DTOs and `NanoPasteApiClient` are not implemented.

- [ ] **Step 2: Implement DTOs**

Use `JsonPropertyName` for backend field names. Required DTOs include `ApiResponse<T>`, `ApiError`, `LoginRequest`, `LoginResponse`, `RefreshRequest`, `RefreshResponse`, `LogoutRequest`, `CreateTextItemRequest`, `CreateItemResponse`, `ItemDetail`, `ListItemsResponse`, `PageMeta`, `UploadFileResponse`, and `PrepareDownloadResponse`.

Expected: DTO names and JSON names match `docs/architecture/windows-winui-plan.md`.

- [ ] **Step 3: Implement API client**

Implement `INanoPasteApiClient` with these methods:

```csharp
Task<bool> CheckHealthAsync(Uri baseUri, CancellationToken cancellationToken = default);
Task<LoginResponse> LoginAsync(Uri baseUri, string username, string password, CancellationToken cancellationToken = default);
Task<RefreshResponse> RefreshAsync(Uri baseUri, string refreshToken, CancellationToken cancellationToken = default);
Task LogoutAsync(Uri baseUri, string refreshToken, CancellationToken cancellationToken = default);
Task<ListItemsResponse> ListItemsAsync(Uri baseUri, string accessToken, int limit = 50, string? cursor = null, CancellationToken cancellationToken = default);
Task<CreateItemResponse> CreateTextItemAsync(Uri baseUri, string accessToken, string content, string? title, IReadOnlyList<string>? tags, CancellationToken cancellationToken = default);
Task DeleteItemAsync(Uri baseUri, string accessToken, string itemId, CancellationToken cancellationToken = default);
Task SetFavoriteAsync(Uri baseUri, string accessToken, string itemId, bool favorite, CancellationToken cancellationToken = default);
Task<UploadFileResponse> UploadFileAsync(Uri baseUri, string accessToken, string filePath, string category, IProgress<double>? progress, CancellationToken cancellationToken = default);
Task<PrepareDownloadResponse> PrepareDownloadAsync(Uri baseUri, string accessToken, string fileId, CancellationToken cancellationToken = default);
```

Expected: authenticated calls set `Authorization: Bearer <access_token>`, API failures throw `NanoPasteApiException`, and multipart upload uses `file` and `category` fields.

- [ ] **Step 4: Verify API client tests pass**

Run:

```powershell
dotnet test .\src\NanoPaste.WinUI.Tests\NanoPaste.WinUI.Tests.csproj
```

Expected: API client tests pass.

## Task 4: Settings and Auth MVP

**Files:**
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Services/IAuthSessionStore.cs`
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Services/AuthSessionStore.cs`
- Create: `apps/windows-winui/src/NanoPaste.WinUI/ViewModels/SettingsViewModel.cs`
- Create: `apps/windows-winui/src/NanoPaste.WinUI/ViewModels/LoginViewModel.cs`
- Test: `apps/windows-winui/src/NanoPaste.WinUI.Tests/SettingsViewModelTests.cs`
- Test: `apps/windows-winui/src/NanoPaste.WinUI.Tests/LoginViewModelTests.cs`

- [ ] **Step 1: Write failing ViewModel tests**

Cover these behaviors:

- `SettingsViewModel_InvalidUrl_DisablesSave`
- `SettingsViewModel_TestConnectionSuccess_ShowsOnlineState`
- `SettingsViewModel_SavePersistsBackendAddress`
- `LoginViewModel_LoginSuccess_SavesSessionAndNavigates`
- `LoginViewModel_LoginFailure_ShowsActionableError`

Run:

```powershell
dotnet test .\src\NanoPaste.WinUI.Tests\NanoPaste.WinUI.Tests.csproj
```

Expected: tests fail because ViewModels and session storage do not exist.

- [ ] **Step 2: Implement session and settings state**

Store backend Base URL, username, access token, refresh token, and token expiry seconds behind service interfaces so tests can use in-memory fakes.

Expected: ViewModels do not call WinUI storage APIs directly.

- [ ] **Step 3: Verify tests pass**

Run:

```powershell
dotnet test .\src\NanoPaste.WinUI.Tests\NanoPaste.WinUI.Tests.csproj
```

Expected: Settings and Login tests pass.

## Task 5: Workspace MVP

**Files:**
- Create: `apps/windows-winui/src/NanoPaste.WinUI/ViewModels/WorkspaceViewModel.cs`
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Views/SendPage.xaml`
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Views/HistoryPage.xaml`
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Views/FavoritesPage.xaml`
- Test: `apps/windows-winui/src/NanoPaste.WinUI.Tests/WorkspaceViewModelTests.cs`

- [ ] **Step 1: Write failing Workspace tests**

Cover these behaviors:

- `WorkspaceViewModel_LoadItems_GroupsFavoritesAndHistory`
- `WorkspaceViewModel_Search_FiltersByTitleContentFileNameAndTags`
- `WorkspaceViewModel_ToggleFavorite_UpdatesLocalStateAfterApiSuccess`
- `WorkspaceViewModel_Delete_RemovesItemAfterApiSuccess`
- `WorkspaceViewModel_SendText_RefreshesItemsAfterCreate`

Run:

```powershell
dotnet test .\src\NanoPaste.WinUI.Tests\NanoPaste.WinUI.Tests.csproj
```

Expected: tests fail because Workspace ViewModel does not exist.

- [ ] **Step 2: Implement Workspace ViewModel**

Use `INanoPasteApiClient` and session state only. Keep search local for MVP and filter by title, content, file name, and tags.

Expected: no direct HTTP or WinUI control code inside the ViewModel.

- [ ] **Step 3: Add initial XAML pages**

Use `NavigationView`, `AutoSuggestBox`, `ListView`, `InfoBar`, and `ContentDialog`. Icon-only buttons must set `AutomationProperties.Name` and `AutomationProperties.AutomationId`.

Expected: pages support Light, Dark, and HighContrast through `{ThemeResource}`.

- [ ] **Step 4: Build and test**

Run:

```powershell
dotnet test .\src\NanoPaste.WinUI.Tests\NanoPaste.WinUI.Tests.csproj
.\BuildAndRun.ps1 -SkipRun
```

Expected: tests pass and packaged build succeeds.

## Task 6: Upload Queue MVP

**Files:**
- Create: `apps/windows-winui/src/NanoPaste.WinUI/ViewModels/UploadQueueViewModel.cs`
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Services/IFilePickerService.cs`
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Views/UploadPage.xaml`
- Test: `apps/windows-winui/src/NanoPaste.WinUI.Tests/UploadQueueViewModelTests.cs`

- [ ] **Step 1: Write failing upload queue tests**

Cover these behaviors:

- `UploadQueueViewModel_Enqueue_AddsQueuedItems`
- `UploadQueueViewModel_UploadSuccess_MarksDoneAndRefreshesItems`
- `UploadQueueViewModel_UploadFailure_KeepsRetryableError`
- `UploadQueueViewModel_CancelQueuedUpload_MarksCancelled`
- `UploadQueueViewModel_ClearFinished_RemovesDoneFailedAndCancelled`

Run:

```powershell
dotnet test .\src\NanoPaste.WinUI.Tests\NanoPaste.WinUI.Tests.csproj
```

Expected: tests fail because upload queue code does not exist.

- [ ] **Step 2: Implement queue state machine**

Use explicit states: `Queued`, `Uploading`, `Done`, `Failed`, and `Cancelled`.

Expected: failed uploads retain a readable error and can be retried.

- [ ] **Step 3: Build and test**

Run:

```powershell
dotnet test .\src\NanoPaste.WinUI.Tests\NanoPaste.WinUI.Tests.csproj
.\BuildAndRun.ps1 -SkipRun
```

Expected: upload tests pass and packaged build succeeds.

## Task 7: Windows Integration Services

**Files:**
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Services/ITrayService.cs`
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Services/IGlobalHotkeyService.cs`
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Services/IClipboardCaptureService.cs`
- Create: `apps/windows-winui/src/NanoPaste.WinUI/Services/INotificationService.cs`
- Test: `apps/windows-winui/src/NanoPaste.WinUI.Tests/WindowsIntegrationServiceTests.cs`

- [ ] **Step 1: Write fake-service tests first**

Cover these behaviors:

- `ClipboardCaptureService_WhenDisabled_DoesNotCapture`
- `ClipboardCaptureService_TextChanged_AddsPendingText`
- `GlobalHotkeyService_HotkeyPressed_InvokesSendCommand`
- `TrayService_ExitCommand_ShutsDownApplication`
- `NotificationService_SendSuccess_ShowsAppNotification`

Run:

```powershell
dotnet test .\src\NanoPaste.WinUI.Tests\NanoPaste.WinUI.Tests.csproj
```

Expected: tests fail because service interfaces and fakes are not wired.

- [ ] **Step 2: Add interfaces and fake implementations**

Keep ViewModels dependent on interfaces only.

Expected: unit tests pass before real Win32 / Windows App SDK integration is added.

- [ ] **Step 3: Add real integrations one at a time**

Implement in this order: tray, global hotkey, clipboard capture, notification.

Expected: each integration can be disabled without breaking core send/history/upload flows.

## Task 8: Packaging

**Files:**
- Modify: `apps/windows-winui/BuildAndRun.ps1`
- Modify: `apps/windows-winui/src/NanoPaste.WinUI/Package.appxmanifest`
- Create: `apps/windows-winui/docs/README.md`

- [ ] **Step 1: Build Release package output**

Run:

```powershell
.\BuildAndRun.ps1 /p:Configuration=Release -SkipRun
```

Expected: Release packaged build succeeds.

- [ ] **Step 2: Generate and install local cert**

Run:

```powershell
winapp cert generate --manifest .
winapp cert install .\devcert.pfx
```

Expected: local development certificate is trusted for installing the app package.

- [ ] **Step 3: Package and install MSIX**

Run:

```powershell
$buildOutputDir = (Get-ChildItem -Path ".\src\NanoPaste.WinUI\bin\x64\Release" -Directory -Recurse | Where-Object { Test-Path (Join-Path $_.FullName "AppxManifest.xml") } | Select-Object -First 1).FullName
winapp package "$buildOutputDir" --cert .\devcert.pfx
Add-AppxPackage .\NanoPaste.msix
```

Expected: app installs and launches through packaged activation. If `$buildOutputDir` is empty, inspect the Release build output and update `BuildAndRun.ps1` to print the package layout directory.

## Final Verification

Run from `apps/windows-winui`:

```powershell
dotnet test .\src\NanoPaste.WinUI.Tests\NanoPaste.WinUI.Tests.csproj
.\BuildAndRun.ps1 -SkipRun
.\BuildAndRun.ps1
```

Expected: tests pass, packaged build succeeds, and the app launches through the supported workflow.
