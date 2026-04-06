import { getAuthSession, clearAuthSession } from "../auth/store";
import { configureRequest } from "../api/request";
import { createUploadQueue } from "../features/files/queue";
import { listDevices, revokeDevice } from "../features/devices/api";
import type { DeviceInfo } from "../../../../packages/contracts/v1";
import { showToast } from "../ui/components/toast";
import {
  getBridgeHooks,
  setBridgeHooks,
  type BridgeHooks,
} from "./hooks";
import { createItemsLoader, loadActiveDevices } from "./loaders";
import { handleItemAction, sendText } from "./item-actions";
import { handleGlobalPaste } from "./paste";
import { createBridgeRealtime } from "./network";

let loadItems: (() => Promise<void>) | null = null;
let uploadQueue: ReturnType<typeof createUploadQueue> | null = null;
let realtime: ReturnType<typeof createBridgeRealtime> | null = null;

export function setBridgeCallbacks(hooks: BridgeHooks): void {
  setBridgeHooks(hooks);
}

export async function initializeBridge(): Promise<void> {
  if (getAuthSession().accessToken) {
    showWorkspace();
  } else {
    showLogin();
  }
}

function showLogin(): void {
  const hooks = getBridgeHooks();
  if (!hooks.onRequireLogin) {
    throw new Error("onRequireLogin hook is required");
  }
  hooks.onRequireLogin();
}

function showWorkspace(): void {
  configureRequest({
    onUnauthorized: () => {
      clearAuthSession();
      realtime?.disconnect();
      showLogin();
    },
  });

  loadItems = createItemsLoader(getBridgeHooks);
  uploadQueue = createUploadQueue({
    onChange: renderQueue,
    onUploadCompleted: () => {
      void loadItems?.();
    },
  });

  realtime = createBridgeRealtime({
    onEvent: () => {
      void loadItems?.();
    },
    onStatusChange: (status) => {
      getBridgeHooks().onConnectionStatusChanged?.(status);
    },
  });

  void loadItems?.();
  void loadDevices();
  realtime.connect();
}

export function logoutSession(): void {
  clearAuthSession();
  realtime?.disconnect();
  showLogin();
}

export async function sendTextItem(payload: { title?: string; content: string }): Promise<void> {
  await sendText(
    payload,
    async () => {
      await loadItems?.();
    },
  );
}

export function enqueueFiles(files: File[]): void {
  if (!files.length) return;
  uploadQueue?.enqueue(files);
}

export async function handleGlobalPasteEvent(event: ClipboardEvent): Promise<void> {
  await handleGlobalPaste(event, {
    hasSession: () => Boolean(getAuthSession().accessToken),
    enqueueFiles,
    sendText: sendTextItem,
  });
}

export async function executeItemAction(
  id: string,
  action: "copy" | "download" | "delete" | "favorite",
  onFavoriteChanged?: (id: string, favorite: boolean) => void,
  copyContent?: string,
): Promise<void> {
  try {
    await handleItemAction(
      id,
      action,
      async () => {
        await loadItems?.();
      },
      copyContent,
      onFavoriteChanged,
    );

    if (action === "delete") {
      showToast("已删除", "success");
    } else if (action === "copy") {
      showToast("已复制到剪贴板", "success");
    } else if (action === "download") {
      showToast("已开始下载（保存到系统下载目录）", "success");
    } else if (action === "favorite") {
      showToast("收藏状态已更新", "success");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "操作失败";
    const actionLabel =
      action === "delete"
        ? "删除"
        : action === "copy"
          ? "复制"
          : action === "download"
            ? "下载"
            : action === "favorite"
              ? "收藏"
              : "操作";
    showToast(`${actionLabel}失败: ${message}`, "error");
  }
}

export function retryUpload(id: string): void {
  uploadQueue?.retry(id);
}

export function clearFinishedUploads(): void {
  uploadQueue?.clearFinished();
  renderQueue();
}

async function loadDevices(): Promise<void> {
  try {
    const activeDevices = await loadActiveDevices();
    getBridgeHooks().onActiveDevicesChanged?.(activeDevices);
  } catch (err) {
    console.error("加载设备列表失败:", err);
    getBridgeHooks().onActiveDevicesChanged?.([]);
  }
}

async function applyRuntimeApiBaseUrl(): Promise<void> {
  realtime?.disconnect();
  realtime = createBridgeRealtime({
    onEvent: () => {
      void loadItems?.();
    },
    onStatusChange: (status) => {
      getBridgeHooks().onConnectionStatusChanged?.(status);
    },
  });

  if (getAuthSession().accessToken) {
    realtime.connect();
  }

  await Promise.all([loadItems?.(), loadDevices()]);
}

export async function applyRuntimeApiBaseUrlChange(): Promise<void> {
  await applyRuntimeApiBaseUrl();
}

export async function fetchDevices(): Promise<DeviceInfo[]> {
  return listDevices();
}

export async function revokeDeviceById(deviceId: string): Promise<void> {
  await revokeDevice(deviceId);
}

export function getCurrentDeviceId(): string {
  return getAuthSession().deviceId;
}

function renderQueue(): void {
  if (!uploadQueue) return;

  const items = uploadQueue.getItems();
  getBridgeHooks().onUploadQueueChanged?.(
    items.map((item) => ({
      id: item.id,
      fileName: item.file.name,
      status: item.status,
      error: item.error,
    })),
  );
}

export async function reloadItems(): Promise<void> {
  await loadItems?.();
}
