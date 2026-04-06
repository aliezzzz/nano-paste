import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const gradlePath = resolve(process.cwd(), "src-tauri/gen/android/app/build.gradle.kts");

if (!existsSync(gradlePath)) {
  console.warn("[android-cleartext] 跳过：未找到 src-tauri/gen/android/app/build.gradle.kts");
  process.exit(0);
}

const source = readFileSync(gradlePath, "utf8");

const replaced = source
  .replace(
    /manifestPlaceholders\["usesCleartextTraffic"\]\s*=\s*"false"/g,
    'manifestPlaceholders["usesCleartextTraffic"] = "true"',
  )
  .replace(
    /usesCleartextTraffic\s*:\s*"false"/g,
    'usesCleartextTraffic: "true"',
  );

if (replaced === source) {
  console.log("[android-cleartext] 无需修改：cleartext 配置已存在或模板结构不同");
  process.exit(0);
}

writeFileSync(gradlePath, replaced, "utf8");
console.log("[android-cleartext] 已启用 Android cleartext HTTP");
