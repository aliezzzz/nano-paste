import { ref, computed, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useUploadQueueStore } from "../stores/upload-queue";
import { useAuthStore } from "../stores/auth";
import { useRuntimeStore } from "../stores/runtime";
import { configureRequest } from "../utils/request";
import { listDevices, revokeDevice } from "../api/devices";
import { showToast } from "../components/feedback/toast";
import { createRealtimeConnection, type RealtimeStatus } from "../utils/ws";
import { listItemDetails } from "../api/items";
import { cleanupFiles } from "../api/files";
import { createTextItem, deleteItem, prepareFileDownload, setItemFavorite } from "../api/items";
import { copyTextToClipboard } from "../utils/clipboard";
import { triggerFileDownload } from "../utils/download";
import { handleGlobalPaste } from "../utils/clipboard";
import { getItemIconSvg } from "../utils/item-icons";
import type { DeviceInfo } from "../../../../packages/contracts/v1";
import type { ItemView, ActiveDeviceView, ItemActionPayload } from "../types/workspace";

export type { ItemView, ActiveDeviceView, ItemActionPayload };

export function useBridge(onLoggedOut: () => void) {
  const uploadQueueStore = useUploadQueueStore();
  const authStore = useAuthStore();
  const runtimeStore = useRuntimeStore();

  const { queueViewItems: queueItems, completedVersion } = storeToRefs(uploadQueueStore);

  // 状态
  const items = ref<ItemView[]>([]);
  const itemsLoading = ref(false);
  const activeDevices = ref<ActiveDeviceView[]>([]);
  const devicesLoading = ref(false);
  const sendingText = ref(false);
  const connectionStatus = ref<RealtimeStatus>("idle");

  // 内部状态
  let realtime: ReturnType<typeof createRealtimeConnection> | null = null;
  let stopUploadQueueSubscription: (() => void) | null = null;

  // 计算属性
  const isAuthenticated = computed(() => Boolean(authStore.accessToken));
  const currentDeviceId = computed(() => authStore.deviceId);

  // 加载条目
  async function loadItems(): Promise<void> {
    if (!isAuthenticated.value) return;

    try {
      itemsLoading.value = true;
      const itemsData = await listItemDetails(50, { sort: "favorite" });
      items.value = itemsData.map((item) => ({
        id: String(item.id),
        type: item.type,
        title: item.title,
        content: item.type === "text" ? item.content : undefined,
        fileId: item.type === "file" ? item.fileId : undefined,
        fileName: item.type === "file" ? item.fileName : undefined,
        fileSize: item.type === "file" ? item.fileSize : undefined,
        isFavorite: item.isFavorite,
        createdAt: item.createdAt,
        iconSvg: getItemIconSvg(item),
      }));
    } catch (err) {
      console.error("加载条目失败:", err);
    } finally {
      itemsLoading.value = false;
    }
  }

  // 加载设备
  async function loadDevices(): Promise<void> {
    if (!isAuthenticated.value) return;

    try {
      devicesLoading.value = true;
      const devices = await listDevices();
      const activeDevicesData = devices.filter((device) => !device.revokedAt);
      activeDevices.value = activeDevicesData.map((device) => ({
        deviceId: device.deviceId,
        deviceName: device.deviceName || "未命名设备",
        platform: device.platform,
        lastSeenAt: device.lastSeenAt,
        isCurrent: device.deviceId === currentDeviceId.value,
      }));
    } catch (err) {
      console.error("加载设备列表失败:", err);
      activeDevices.value = [];
    } finally {
      devicesLoading.value = false;
    }
  }

  // 显示登录页面
  function showLogin(): void {
    uploadQueueStore.reset();
    stopUploadQueueSubscription?.();
    stopUploadQueueSubscription = null;
    realtime?.disconnect();
    realtime = null;
    onLoggedOut();
  }

  // 显示工作台
  function showWorkspace(): void {
    configureRequest({
      onUnauthorized: () => {
        authStore.clearSession();
        realtime?.disconnect();
        showLogin();
      },
    });

    // 监听上传队列完成事件
    stopUploadQueueSubscription?.();
    let lastCompletedVersion = completedVersion.value;
    stopUploadQueueSubscription = uploadQueueStore.$subscribe((_mutation, state) => {
      if (state.completedVersion !== lastCompletedVersion) {
        lastCompletedVersion = state.completedVersion;
        void loadItems();
      }
    });

    // 创建实时连接
    realtime = createRealtimeConnection({
      apiBaseUrl: runtimeStore.apiBaseUrl,
      getAccessToken: () => authStore.accessToken,
      onEvent: () => {
        void loadItems();
      },
      onStatusChange: (status) => {
        connectionStatus.value = status;
      },
    });

    void loadItems();
    void loadDevices();
    realtime.connect();
  }

  // 初始化
  function initialize(): void {
    if (isAuthenticated.value) {
      showWorkspace();
    } else {
      showLogin();
    }
  }

  // 登出
  function logout(): void {
    authStore.clearSession();
    uploadQueueStore.reset();
    stopUploadQueueSubscription?.();
    stopUploadQueueSubscription = null;
    realtime?.disconnect();
    realtime = null;
    showLogin();
  }

  // 发送文本
  async function sendTextItem(payload: { title?: string; content: string }): Promise<void> {
    const content = payload.content?.trim();
    if (!content) {
      throw new Error("请输入内容");
    }

    try {
      sendingText.value = true;
      await createTextItem({
        title: payload.title,
        content,
      });
      await loadItems();
      showToast("发送成功", "success");
    } catch (error) {
      showToast(`发送失败: ${error instanceof Error ? error.message : "发送失败"}`, "error");
      throw error;
    } finally {
      sendingText.value = false;
    }
  }

  // 上传文件
  function uploadFiles(files: File[]): void {
    if (!files.length) return;
    uploadQueueStore.enqueue(files);
  }

  // 重试上传
  function retryUpload(id: string): void {
    uploadQueueStore.retry(id);
  }

  // 清除已完成上传
  function clearFinishedUploads(): void {
    uploadQueueStore.clearFinished();
  }

  // 执行条目操作
  async function executeItemAction(
    payload: ItemActionPayload,
    onFavoriteChanged?: (id: string, favorite: boolean) => void,
  ): Promise<void> {
    const { action, id, type } = payload;

    try {
      if (action === "delete") {
        if (type === "file") {
          await cleanupFiles({ itemIds: [id], reason: "manual" });
        } else {
          await deleteItem(id);
        }
        await loadItems();
        showToast("已删除", "success");
      } else if (action === "copy") {
        if (type !== "text" || !payload.content) {
          throw new Error("无法复制此内容");
        }
        await copyTextToClipboard(payload.content);
        showToast("已复制到剪贴板", "success");
      } else if (action === "download") {
        if (type !== "file" || !payload.fileId) {
          throw new Error("不是可下载的文件条目");
        }
        const prepared = await prepareFileDownload(payload.fileId);
        const fullUrl = prepared.downloadUrl.startsWith("http")
          ? prepared.downloadUrl
          : `${runtimeStore.apiBaseUrl}${prepared.downloadUrl.startsWith("/") ? "" : "/"}${prepared.downloadUrl}`;
        await triggerFileDownload(
          fullUrl,
          prepared.fileName || payload.fileName || "download.bin",
        );
        showToast("已开始下载（保存到系统下载目录）", "success");
      } else if (action === "favorite") {
        const nextFavorite = !payload.isFavorite;
        await setItemFavorite(id, nextFavorite);
        onFavoriteChanged?.(id, nextFavorite);
        // 更新本地状态
        const item = items.value.find((i) => i.id === id);
        if (item) {
          item.isFavorite = nextFavorite;
        }
        showToast("收藏状态已更新", "success");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "操作失败";
      const actionLabel =
        action === "delete" ? "删除" :
        action === "copy" ? "复制" :
        action === "download" ? "下载" :
        action === "favorite" ? "收藏" : "操作";
      showToast(`${actionLabel}失败: ${message}`, "error");
      throw err;
    }
  }

  // 处理全局粘贴事件
  async function handleGlobalPasteEvent(event: ClipboardEvent): Promise<void> {
    await handleGlobalPaste(event, {
      hasSession: () => Boolean(authStore.accessToken),
      enqueueFiles: uploadFiles,
      sendText: sendTextItem,
    });
  }

  // 获取设备列表（用于设备管理）
  async function fetchDevices(): Promise<DeviceInfo[]> {
    return listDevices();
  }

  // 下线设备
  async function revokeDeviceById(deviceId: string): Promise<void> {
    await revokeDevice(deviceId);
  }

  // 应用运行时 API 地址变更
  async function applyRuntimeApiBaseUrlChange(): Promise<void> {
    realtime?.disconnect();
    realtime = null;

    if (isAuthenticated.value) {
      realtime = createRealtimeConnection({
        apiBaseUrl: runtimeStore.apiBaseUrl,
        getAccessToken: () => authStore.accessToken,
        onEvent: () => {
          void loadItems();
        },
        onStatusChange: (status) => {
          connectionStatus.value = status;
        },
      });
      realtime.connect();
    }

    await Promise.all([loadItems(), loadDevices()]);
  }

  // 清理
  onUnmounted(() => {
    stopUploadQueueSubscription?.();
    stopUploadQueueSubscription = null;
    realtime?.disconnect();
    realtime = null;
  });

  return {
    // 状态
    queueItems,
    items,
    itemsLoading,
    activeDevices,
    devicesLoading,
    sendingText,
    connectionStatus,
    currentDeviceId,
    // 方法
    initialize,
    logout,
    loadItems,
    loadDevices,
    sendTextItem,
    uploadFiles,
    retryUpload,
    clearFinishedUploads,
    executeItemAction,
    handleGlobalPasteEvent,
    fetchDevices,
    revokeDeviceById,
    applyRuntimeApiBaseUrlChange,
  };
}
