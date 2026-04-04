import { getAuthSession, clearAuthSession } from "../auth/store";
import { createUploadQueue } from "../features/files/queue";
import { listDevices, revokeDevice } from "../features/devices/api";
import type { DeviceInfo } from "../../../../packages/contracts/v1";
import { showToast } from "../ui/components/toast";
import { ApiClient } from "../api/client";
import {
  getBridgeHooks,
  setBridgeHooks,
  type BridgeHooks,
} from "./hooks";
import { createItemsLoader, loadActiveDevices } from "./loaders";
import { handleItemAction, sendText } from "./item-actions";
import { handleGlobalPaste } from "./paste";
import { createBridgeApiClient, createBridgeRealtime } from "./network";

let loadItems: (() => Promise<void>) | null = null;
let uploadQueue: ReturnType<typeof createUploadQueue> | null = null;
let realtime: ReturnType<typeof createBridgeRealtime> | null = null;
let apiClient: ApiClient | null = null;

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
  apiClient = createBridgeApiClient(() => {
    clearAuthSession();
    realtime?.disconnect();
    showLogin();
  });

  loadItems = createItemsLoader(() => apiClient, getBridgeHooks);
  uploadQueue = createUploadQueue(apiClient, {
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
    () => apiClient,
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
    hasApiClient: () => Boolean(apiClient),
    enqueueFiles,
    sendText: sendTextItem,
  });
}

export async function executeItemAction(id: string, action: string): Promise<void> {
  try {
    await handleItemAction(
      () => apiClient,
      id,
      action,
      async () => {
        await loadItems?.();
      },
    );

    if (action === "delete") {
      showToast("已删除", "success");
    } else if (action === "copy") {
      showToast("已复制到剪贴板", "success");
    } else if (action === "download") {
      showToast("已开始下载（保存到系统下载目录）", "success");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "操作失败";
    showToast(`${action === "delete" ? "删除" : action === "copy" ? "复制" : "下载"}失败: ${message}`, "error");
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
    const activeDevices = await loadActiveDevices(() => apiClient);
    getBridgeHooks().onActiveDevicesChanged?.(activeDevices);
  } catch (err) {
    console.error("加载设备列表失败:", err);
    getBridgeHooks().onActiveDevicesChanged?.([]);
  }
}

async function applyRuntimeApiBaseUrl(): Promise<void> {
  apiClient = createBridgeApiClient(() => {
    clearAuthSession();
    realtime?.disconnect();
    showLogin();
  });

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
  if (!apiClient) {
    throw new Error("API 客户端未初始化");
  }
  return listDevices(apiClient);
}

export async function revokeDeviceById(deviceId: string): Promise<void> {
  if (!apiClient) {
    throw new Error("API 客户端未初始化");
  }
  await revokeDevice(apiClient, deviceId);
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
