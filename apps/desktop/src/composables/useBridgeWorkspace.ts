import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useUploadQueueStore } from "../stores/upload-queue";
import {
  setBridgeCallbacks,
  initializeBridge,
  logoutSession,
  sendTextItem,
  enqueueFiles,
  executeItemAction,
  reloadItems,
} from "../bridge";
import { showToast } from "../components/feedback/toast";
import type { ItemView, ActiveDeviceView, ItemActionPayload, RealtimeStatus } from "../types/workspace";

export function useBridgeWorkspace(onLoggedOut: () => void) {
  const uploadQueueStore = useUploadQueueStore();
  const { queueViewItems: queueItems } = storeToRefs(uploadQueueStore);

  const items = ref<ItemView[]>([]);
  const itemsLoading = ref(false);
  const activeDevices = ref<ActiveDeviceView[]>([]);
  const sendingText = ref(false);
  const connectionStatus = ref<RealtimeStatus>("idle");

  setBridgeCallbacks({
    onRequireLogin: () => {
      items.value = [];
      itemsLoading.value = false;
      activeDevices.value = [];
      sendingText.value = false;
      connectionStatus.value = "idle";
      onLoggedOut();
    },
    onItemsLoadingChanged: (loading) => {
      itemsLoading.value = loading;
    },
    onItemsChanged: (nextItems) => {
      items.value = nextItems;
    },
    onActiveDevicesChanged: (nextDevices) => {
      activeDevices.value = nextDevices;
    },
    onConnectionStatusChanged: (status) => {
      connectionStatus.value = status;
    },
  });

  async function startWorkspace(): Promise<void> {
    await initializeBridge();
  }

  function logout(): void {
    logoutSession();
  }

  async function handleSendText(payload: { title?: string; content: string }): Promise<void> {
    try {
      sendingText.value = true;
      await sendTextItem(payload);
      showToast("发送成功", "success");
    } catch (error) {
      showToast(`发送失败: ${error instanceof Error ? error.message : "发送失败"}`, "error");
    } finally {
      sendingText.value = false;
    }
  }

  function handleUploadFiles(files: File[]): void {
    enqueueFiles(files);
  }

  function handleRetryUpload(id: string): void {
    uploadQueueStore.retry(id);
  }

  function handleClearFinishedUpload(): void {
    uploadQueueStore.clearFinished();
  }

  async function handleItemAction(payload: ItemActionPayload): Promise<void> {
    await executeItemAction(payload, (id, favorite) => {
      items.value = items.value.map((item) =>
        item.id === id ? { ...item, isFavorite: favorite } : item,
      );
    });
  }

  async function handleRefreshItems(): Promise<void> {
    try {
      await reloadItems();
    } catch (error) {
      console.error("刷新条目失败:", error);
    }
  }

  return {
    queueItems,
    items,
    itemsLoading,
    activeDevices,
    sendingText,
    connectionStatus,
    startWorkspace,
    logout,
    handleSendText,
    handleUploadFiles,
    handleRetryUpload,
    handleClearFinishedUpload,
    handleItemAction,
    handleRefreshItems,
  };
}
