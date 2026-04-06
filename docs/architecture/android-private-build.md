# Android 私发构建说明

本文档用于收敛 `apps/desktop` 的 Android 构建、签名和分发流程。目标是让后续维护只依赖一套稳定路径，避免再次出现未签名包、重复脚本或多 ABI 混用问题。

## 目标

- 只构建 ARMv8 Android 安装包。
- 默认产出可安装的已签名 `release APK`。
- 保留最少的本地环境要求和最少的手工步骤。
- 让后续分发只认一个产物路径。

## 当前约定

项目当前仅支持以下 Android 目标：

- ABI: `arm64-v8a`
- Rust target: `aarch64-linux-android`
- 安装产物类型: `APK`

不支持以下目标：

- `armv7`
- `x86`
- `x86_64`

## 入口命令

### 开发调试

在 `apps/desktop` 目录执行：

```bat
npm run android:dev
```

当前行为：

- 先执行 `scripts/android-enable-cleartext.mjs`
- 再执行 `tauri android dev --target aarch64`

### 正式构建

推荐在 Windows 下执行：

```bat
apps\desktop\build-android-arm64.bat
```

该脚本会临时设置：

- `JAVA_HOME`
- `ANDROID_HOME`
- `ANDROID_SDK_ROOT`
- `PATH`

脚本默认优先使用：

- `C:\Program Files\Java\jdk-22`

若不存在，则回退到：

- `C:\Program Files\Java\jdk-17`

脚本最终调用：

```bat
npm run android:build
```

而 `package.json` 中当前正式构建命令为：

```json
"android:build": "node ./scripts/android-enable-cleartext.mjs && tauri android build --target aarch64 --apk"
```

## 产物路径

正式发布只认以下文件：

```text
apps/desktop/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

不要分发以下文件：

- `*-unsigned.apk`
- `baselineProfiles/*.dm`
- `mapping/*`

## 签名配置

当前 Android `release` 构建已经接入本地签名。

### 本地签名文件

- Keystore 文件：

```text
apps/desktop/src-tauri/gen/android/app/nanopaste-release.jks
```

- 本地签名配置：

```text
apps/desktop/src-tauri/gen/android/keystore.properties
```

### Gradle 接入点

当前签名逻辑位于：

```text
apps/desktop/src-tauri/gen/android/app/build.gradle.kts
```

其职责是：

- 从 `keystore.properties` 读取签名参数
- 创建 `release` 的 `signingConfig`
- 将 `buildTypes.release` 绑定到该签名配置

### 安全约定

以下文件已通过 `.gitignore` 排除，不应提交到仓库：

- `apps/desktop/src-tauri/gen/android/keystore.properties`
- `apps/desktop/src-tauri/gen/android/app/*.jks`

如果未来更换机器，需要同时迁移：

- `nanopaste-release.jks`
- `keystore.properties`

如果 keystore 丢失，后续新包将无法覆盖安装旧版本。

## 环境要求

构建机至少需要：

- Android SDK
- Android NDK
- Android Command-line Tools
- JDK 17 或 JDK 22
- Rust target: `aarch64-linux-android`

当前已验证可用的 SDK 路径示例：

```text
C:\Users\50414\AppData\Local\Android\Sdk
```

## 已知注意事项

### 1. Windows symlink 权限

Tauri Android 构建过程中会为 `jniLibs` 创建符号链接。

如果报错：

```text
Creation symbolic link is not allowed for this system.
```

说明当前终端没有创建 symlink 的权限。可选处理方式：

- 使用可创建 symlink 的终端/权限环境
- 开启 Windows Developer Mode

### 2. 后端地址

Android 端不要使用 `localhost`。

当前产品策略是：

- 后端地址由应用前端运行时配置
- 构建流程不内置固定服务地址

### 3. `gen/android` 是生成目录

当前项目确实在 `gen/android` 下保留了必要定制，包括：

- ARM64 限制
- release 签名配置

如果未来重新执行 `tauri android init` 导致生成文件覆盖，需要重点复查：

- `app/build.gradle.kts`
- keystore 配置是否仍被读取
- ABI 是否仍限制为 `arm64-v8a`

## 推荐发布流程

每次发给自己或朋友前，按以下步骤执行：

1. 在 `apps/desktop` 执行 `build-android-arm64.bat`
2. 确认产物存在：

```text
apps/desktop/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

3. 可选执行签名校验：

```bat
"C:\Users\50414\AppData\Local\Android\Sdk\build-tools\35.0.0\apksigner.bat" verify -v "apps\desktop\src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release.apk"
```

4. 仅分发 `app-universal-release.apk`

## 未来收敛建议

当前流程已经可用，但后续如果继续优化，优先顺序建议如下：

1. 把 `gen/android` 的必要定制进一步脚本化，减少重新初始化后的手工恢复成本
2. 增加一个发布后校验脚本，自动检查：
   - APK 文件是否存在
   - 文件名是否不是 `unsigned`
   - `apksigner verify` 是否通过
3. 在 README 中只保留这一条正式安卓发布路径，避免与旧说明并存
