import { ref, computed, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useUploadQueueStore } from "../stores/upload-queue";
import { useAuthStore } from "../stores/auth";
import { useRuntimeStore } from "../stores/runtime";
import { useUndoStore } from "../stores/undo";
import { configureRequest } from "../utils/request";
import { showToast } from "../components/feedback/toast";
import { listItemDetails, listTopics } from "../api/items";
import { cleanupFiles } from "../api/files";
import { createTextItem, deleteItem, prepareFileDownload, setItemFavorite, setItemTopic } from "../api/items";
import { copyTextToClipboard } from "../utils/clipboard";
import { triggerFileDownload } from "../utils/download";
import { handleGlobalPaste } from "../utils/clipboard";
import { getItemIconSvg, isImageFile } from "../utils/item-icons";
import type { ItemView, ItemActionPayload } from "../types/workspace";
import type { TopicInfo } from "../components/workspace/TopicList.vue";

export type { ItemView, ItemActionPayload };

export function useBridge(onLoggedOut: () => void) {
  const uploadQueueStore = useUploadQueueStore();
  const authStore = useAuthStore();
  const runtimeStore = useRuntimeStore();
  const undoStore = useUndoStore();

	const { queueViewItems: queueItems, completedVersion } = storeToRefs(uploadQueueStore);

	const items = ref<ItemView[]>([]);
	const itemsLoading = ref(false);
	const sendingText = ref(false);
	const sentTextVersion = ref(0);

  // 图片预览状态
  const imagePreview = ref<{ imageUrl: string; fileName: string; fileSize?: number } | null>(null);
  const codePreview = ref<{ title?: string; code: string; language?: string } | null>(null);

  // 话题状态
  const topics = ref<TopicInfo[]>([]);
  const activeTopic = ref("");

  // 内部状态
  let stopUploadQueueSubscription: (() => void) | null = null;

  // 计算属性
	const isAuthenticated = computed(() => Boolean(authStore.accessToken));

  // 加载条目
  async function loadItems(): Promise<void> {
    if (!isAuthenticated.value) return;

    try {
      itemsLoading.value = true;
      const itemsData = await listItemDetails(50, {
        sort: "favorite",
        topic: activeTopic.value || undefined,
      });
      items.value = itemsData.map((item) => ({
        id: String(item.id),
        type: item.type,
        title: item.title,
        content: item.type === "text" ? item.content : undefined,
        fileId: item.type === "file" ? item.fileId : undefined,
        fileName: item.type === "file" ? item.fileName : undefined,
        fileSize: item.type === "file" ? item.fileSize : undefined,
        imageUrl:
          item.type === "file" && item.fileId && item.fileName && isImageFile(item.fileName)
            ? `${runtimeStore.apiBaseUrl}/v1/files/download/${encodeURIComponent(item.fileId)}?access_token=${encodeURIComponent(authStore.accessToken ?? "")}`
            : undefined,
        isFavorite: item.isFavorite,
        createdAt: item.createdAt,
        iconSvg: getItemIconSvg(item),
        topic: item.topic,
        contentKind: item.type === "text" ? item.contentKind : undefined,
        language: item.type === "text" ? item.language : undefined,
      }));
    } catch (err) {
      console.error("加载条目失败:", err);
    } finally {
      itemsLoading.value = false;
    }
  }

  // 显示登录页面
  function showLogin(): void {
    uploadQueueStore.reset();
    stopUploadQueueSubscription?.();
    stopUploadQueueSubscription = null;
    onLoggedOut();
  }

  // 加载话题列表
  async function loadTopics(): Promise<void> {
    if (!isAuthenticated.value) return;

    try {
      topics.value = await listTopics();
    } catch (err) {
      console.error("加载话题列表失败:", err);
    }
  }

  // 选择话题
  function selectTopic(topic: string): void {
    activeTopic.value = topic;
    void loadItems();
  }

  // 显示工作台
  function showWorkspace(): void {
    configureRequest({
      onUnauthorized: () => {
        authStore.clearSession();
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

    void loadItems();
    void loadTopics();
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
    showLogin();
  }

  // 发送文本
  async function sendTextItem(payload: { title?: string; content: string; tags?: string[]; topic?: string; contentKind?: "text" | "code"; language?: string }): Promise<void> {
    const content = payload.content?.trim();
    if (!content) {
      throw new Error("请输入内容");
    }

    try {
      sendingText.value = true;
      await createTextItem({
        title: payload.title,
        content,
        tags: payload.tags,
        topic: payload.topic,
        contentKind: payload.contentKind,
        language: payload.language,
      });
      await loadItems();
      await loadTopics();
      sentTextVersion.value += 1;
      showToast("发送成功", "success");
    } catch (error) {
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

  function cancelUpload(id: string): void {
    uploadQueueStore.cancel(id);
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
        undoStore.push("已删除，可撤销");
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
      } else if (action === "preview") {
        if (type !== "file" || !payload.fileId) {
          throw new Error("不是可预览的文件条目");
        }
        const prepared = await prepareFileDownload(payload.fileId);
        const fullUrl = prepared.downloadUrl.startsWith("http")
          ? prepared.downloadUrl
          : `${runtimeStore.apiBaseUrl}${prepared.downloadUrl.startsWith("/") ? "" : "/"}${prepared.downloadUrl}`;
        imagePreview.value = {
          imageUrl: fullUrl,
          fileName: prepared.fileName || payload.fileName || "image",
          fileSize: prepared.fileSize,
        };
      } else if (action === "preview-code") {
        if (type !== "text" || !payload.content) {
          throw new Error("不是可预览的代码条目");
        }
        codePreview.value = {
          title: payload.title,
          code: payload.content,
          language: payload.language,
        };
      } else if (action === "set-topic") {
        const topic = payload.topic || "";
        await setItemTopic(id, topic);
        const item = items.value.find((i) => i.id === id);
        if (item) {
          item.topic = topic;
        }
        showToast("话题已更新", "success");
        void loadTopics();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "操作失败";
      const actionLabel =
        action === "delete" ? "删除" :
        action === "copy" ? "复制" :
        action === "download" ? "下载" :
        action === "favorite" ? "收藏" :
        action === "preview" ? "预览" :
        action === "preview-code" ? "代码预览" :
        action === "set-topic" ? "话题" : "操作";
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

  // 关闭图片预览
  function closeImagePreview(): void {
    imagePreview.value = null;
  }

  function closeCodePreview(): void {
    codePreview.value = null;
  }

  onUnmounted(() => {
    stopUploadQueueSubscription?.();
    stopUploadQueueSubscription = null;
  });

  return {
    // 状态
		queueItems,
		items,
		itemsLoading,
		sendingText,
		sentTextVersion,
		imagePreview,
		codePreview,
		topics,
		activeTopic,
		// 方法
		initialize,
		logout,
		loadItems,
		loadTopics,
		sendTextItem,
    uploadFiles,
    retryUpload,
    cancelUpload,
    clearFinishedUploads,
		executeItemAction,
		closeImagePreview,
		closeCodePreview,
		selectTopic,
		handleGlobalPasteEvent,
	};
}
