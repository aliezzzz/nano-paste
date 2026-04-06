import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const sourceDir = resolve(process.cwd(), "src-tauri/icons/android");
const targetDir = resolve(process.cwd(), "src-tauri/gen/android/app/src/main/res");

if (!existsSync(sourceDir)) {
  console.warn("[android-icons] 跳过：未找到 src-tauri/icons/android");
  process.exit(0);
}

if (!existsSync(targetDir)) {
  console.warn("[android-icons] 跳过：未找到 src-tauri/gen/android/app/src/main/res，请先执行 npm run android:init");
  process.exit(0);
}

cpSync(sourceDir, targetDir, { recursive: true, force: true });

// Disable adaptive icon to avoid launcher secondary scaling on Android 8+.
const adaptiveIconPath = resolve(targetDir, "mipmap-anydpi-v26/ic_launcher.xml");
if (existsSync(adaptiveIconPath)) {
  rmSync(adaptiveIconPath);
}

console.log("[android-icons] 已同步 Android 图标到 gen/android 资源目录");
