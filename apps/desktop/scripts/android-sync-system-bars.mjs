import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const themeFiles = [
  resolve(process.cwd(), "src-tauri/gen/android/app/src/main/res/values/themes.xml"),
  resolve(process.cwd(), "src-tauri/gen/android/app/src/main/res/values-night/themes.xml"),
];

const desiredItems = [
  ["android:statusBarColor", "#0B1328"],
  ["android:navigationBarColor", "#0B1328"],
  ["android:windowLightStatusBar", "false"],
  ["android:windowLightNavigationBar", "false"],
  ["android:windowDrawsSystemBarBackgrounds", "true"],
];

let updatedCount = 0;

for (const filePath of themeFiles) {
  if (!existsSync(filePath)) {
    continue;
  }

  const source = readFileSync(filePath, "utf8");
  const patched = upsertThemeItems(source, desiredItems);

  if (patched !== source) {
    writeFileSync(filePath, patched, "utf8");
    updatedCount += 1;
  }
}

if (updatedCount === 0) {
  console.warn("[android-system-bars] 跳过：未找到可更新主题文件或配置已是最新");
  process.exit(0);
}

console.log(`[android-system-bars] 已更新 ${updatedCount} 个 Android 主题文件`);

function upsertThemeItems(xml, items) {
  let next = xml;

  for (const [name, value] of items) {
    const itemRegex = new RegExp(`<item\\s+name=\"${escapeRegExp(name)}\">[^<]*<\\/item>`, "g");
    if (itemRegex.test(next)) {
      next = next.replace(itemRegex, `<item name="${name}">${value}</item>`);
      continue;
    }

    const styleCloseRegex = /<\/style>/;
    if (styleCloseRegex.test(next)) {
      next = next.replace(styleCloseRegex, `    <item name="${name}">${value}</item>\n</style>`);
    }
  }

  return next;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
