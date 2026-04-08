import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const [, , mode, defaultTarget] = process.argv;

if (!mode || !defaultTarget || (mode !== "dev" && mode !== "build")) {
  console.error("Usage: node scripts/run-vite-with-build-target.mjs <dev|build> <default-target>");
  process.exit(1);
}

const target = (process.env.NANOPASTE_BUILD_TARGET || defaultTarget).trim().toLowerCase();
const platform = resolveBuildPlatform(target);
const deviceName = resolveDeviceName(platform);

const env = {
  ...process.env,
  VITE_BUILD_PLATFORM: platform,
  VITE_DEVICE_NAME: deviceName,
};

const viteArgs = mode === "build" ? ["build"] : [];
const viteBin = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const child = spawn(process.execPath, [viteBin, ...viteArgs], {
  stdio: "inherit",
  env,
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

function resolveBuildPlatform(targetValue) {
  switch (targetValue) {
    case "macos":
    case "windows":
    case "linux":
    case "web":
    case "android":
      return targetValue;
    case "desktop":
      return mapNodePlatform(process.platform);
    default:
      return "unknown";
  }
}

function mapNodePlatform(nodePlatform) {
  switch (nodePlatform) {
    case "darwin":
      return "macos";
    case "win32":
      return "windows";
    case "linux":
      return "linux";
    default:
      return "unknown";
  }
}

function resolveDeviceName(platformValue) {
  if (platformValue === "web") {
    return "web";
  }
  if (platformValue === "android") {
    return "nanopaste-android";
  }
  return "nanopaste-desktop";
}
