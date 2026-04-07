import { getAuthSession, clearAuthSession } from "../stores/auth";
import { configureRequest } from "../utils/request";
import { listDevices, revokeDevice } from "../api/devices";
import type { DeviceInfo } from "../../../../packages/contracts/v1";
import { showToast } from "../components/feedback/toast";
import { pinia } from "../stores";
import { useUploadQueueStore } from "../stores/upload-queue";
import {
  getBridgeHooks,
  setBridgeHooks,
  type BridgeHooks,
} from "./hooks";
import { createItemsLoader, loadActiveDevices } from "./loaders";
import { handleItemAction, sendText, type ItemActionPayload } from "./item-actions";
import { handleGlobalPaste } from "./paste";
import { createBridgeRealtime } from "./network";

let loadItems: (() => Promise<void>) | null = null;
let realtime: ReturnType<typeof createBridgeRealtime> | null = null;
let stopUploadQueueSubscription: (() => void) | null = null;
const uploadQueue = useUploadQueueStore(pinia);

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
  uploadQueue.reset();
  stopUploadQueueSubscription?.();
  stopUploadQueueSubscription = null;

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

  stopUploadQueueSubscription?.();
  let completedVersion = uploadQueue.completedVersion;
  stopUploadQueueSubscription = uploadQueue.$subscribe((_mutation, state) => {
    if (state.completedVersion !== completedVersion) {
      completedVersion = state.completedVersion;
      void loadItems?.();
    }
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
  uploadQueue.reset();
  stopUploadQueueSubscription?.();
  stopUploadQueueSubscription = null;
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
  uploadQueue.enqueue(files);
}

export async function handleGlobalPasteEvent(event: ClipboardEvent): Promise<void> {
  await handleGlobalPaste(event, {
    hasSession: () => Boolean(getAuthSession().accessToken),
    enqueueFiles,
    sendText: sendTextItem,
  });
}

export async function executeItemAction(
  payload: ItemActionPayload,
  onFavoriteChanged?: (id: string, favorite: boolean) => void,
): Promise<void> {
  const { action } = payload;

  try {
    await handleItemAction(
      payload,
      async () => {
        await loadItems?.();
      },
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
  uploadQueue.retry(id);
}

export function clearFinishedUploads(): void {
  uploadQueue.clearFinished();
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

export async function reloadItems(): Promise<void> {
  await loadItems?.();
}
