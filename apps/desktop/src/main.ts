import "./styles.css";
import { API_BASE_URL } from "./config/env";
import { createUiShell } from "./ui";
import { getAuthSession, clearAuthSession, getDeviceId, setAuthSession } from "./auth/store";
import { ApiClient, ApiRequestError } from "./api/client";
import { loginWithPassword, logoutWithRefreshToken, refreshWithToken } from "./api/auth";
import { createUploadQueue, type UploadQueueItem, type UploadQueueStatus } from "./features/files/queue";
import { createTextItem, listItemDetails, prepareFileDownload } from "./features/items/api";
import { renderItems } from "./features/items/render";
import { createRealtimeConnection, type RealtimeStatus } from "./realtime/ws";
import { toErrorMessage } from "./shared/errors";
import { formatBytes } from "./shared/format";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

app.innerHTML = createUiShell();

const authScreenEl = mustById<HTMLElement>("auth-screen");
const workspaceEl = mustById<HTMLElement>("workspace");
const connectionStatusEl = mustById<HTMLParagraphElement>("connection-status");
const authStatusEl = mustById<HTMLParagraphElement>("auth-status");
const itemsLoadingEl = mustById<HTMLParagraphElement>("items-loading");
const itemsListEl = mustById<HTMLUListElement>("items-list");
const itemsEmptyEl = mustById<HTMLParagraphElement>("items-empty");
const downloadStatusEl = mustById<HTMLParagraphElement>("download-status");
const loginFormEl = mustById<HTMLFormElement>("login-form");
const usernameInputEl = mustById<HTMLInputElement>("login-username");
const passwordInputEl = mustById<HTMLInputElement>("login-password");
const logoutBtnEl = mustById<HTMLButtonElement>("logout-btn");
const textFormEl = mustById<HTMLFormElement>("text-form");
const textTitleInputEl = mustById<HTMLInputElement>("text-title-input");
const textInputEl = mustById<HTMLInputElement>("text-input");
const uploadDropzoneEl = mustById<HTMLDivElement>("upload-dropzone");
const pickFilesBtnEl = mustById<HTMLButtonElement>("pick-files-btn");
const fileInputEl = mustById<HTMLInputElement>("file-input");
const uploadQueueListEl = mustById<HTMLUListElement>("upload-queue-list");
const uploadQueueEmptyEl = mustById<HTMLParagraphElement>("upload-queue-empty");
const queueClearBtnEl = mustById<HTMLButtonElement>("queue-clear-btn");

let currentWsStatus: RealtimeStatus = "idle";
let realtime = createRealtimeConnection({
  apiBaseUrl: API_BASE_URL,
  getAccessToken: () => getAuthSession().accessToken,
  onEvent: () => {
    void refreshItems();
  },
  onStatusChange: (status) => {
    currentWsStatus = status;
    renderConnectionStatus();
  },
});

const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  getAccessToken: () => getAuthSession().accessToken,
  getDeviceId,
  onUnauthorized: () => {
    clearAuthSession();
    realtime.disconnect();
    renderAuthState();
    renderConnectionStatus();
    itemsListEl.innerHTML = "";
    itemsEmptyEl.textContent = "请先登录";
    itemsEmptyEl.classList.remove("hidden");
  },
  refreshAccessToken: async () => {
    const current = getAuthSession();
    if (!current.refreshToken) return false;

    try {
      const refreshed = await refreshWithToken(API_BASE_URL, current.refreshToken, getDeviceId());
      setAuthSession(refreshed.tokens, undefined, refreshed.deviceId);
      return true;
    } catch {
      return false;
    }
  },
});

const uploadQueue = createUploadQueue(apiClient, {
  onChange: (items) => {
    renderUploadQueue(items);
  },
  onUploadCompleted: () => {
    void refreshItems();
  },
});

void bootstrap();

function mustById<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
}

async function bootstrap(): Promise<void> {
  renderUploadQueue(uploadQueue.getItems());
  renderAuthState();
  bindActions();

  if (getAuthSession().accessToken) {
    toggleWorkspace(true);
    realtime.connect();
    await refreshItems();
  } else {
    toggleWorkspace(false);
    itemsEmptyEl.textContent = "请先登录";
    itemsEmptyEl.classList.remove("hidden");
  }

  renderConnectionStatus();
}

function bindActions(): void {
  loginFormEl.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInputEl.value.trim();
    const password = passwordInputEl.value;
    if (!username || !password) return;

    setConnectionMessage("登录中...");
    try {
      const result = await loginWithPassword({
        baseUrl: API_BASE_URL,
        username,
        password,
      });
      setAuthSession(result.tokens, result.username ?? username, result.deviceId);
      passwordInputEl.value = "";
      renderAuthState();
      toggleWorkspace(true);
      realtime.disconnect();
      realtime.connect();
      await refreshItems();
    } catch (error) {
      setConnectionMessage(`登录失败：${toErrorMessage(error)}`);
    }
  });

  logoutBtnEl.addEventListener("click", async () => {
    const session = getAuthSession();
    try {
      if (session.refreshToken) {
        await logoutWithRefreshToken(API_BASE_URL, session.refreshToken, getDeviceId());
      }
    } catch {
      // 忽略登出请求失败，保证本地状态可清除
    } finally {
      clearAuthSession();
      realtime.disconnect();
      toggleWorkspace(false);
      itemsListEl.innerHTML = "";
      itemsEmptyEl.textContent = "请先登录";
      itemsEmptyEl.classList.remove("hidden");
      downloadStatusEl.textContent = "";
      renderAuthState();
      renderConnectionStatus();
    }
  });

  textFormEl.addEventListener("submit", async (event) => {
    event.preventDefault();

    const content = textInputEl.value.trim();
    const title = textTitleInputEl.value.trim();
    if (!content) return;

    if (!getAuthSession().accessToken) {
      setConnectionMessage("请先登录后发送文本");
      return;
    }

    try {
      await createTextItem(apiClient, {
        content,
        title: title || undefined,
      });
      textTitleInputEl.value = "";
      textInputEl.value = "";
      await refreshItems();
    } catch (error) {
      setConnectionMessage(`发送失败：${toErrorMessage(error)}`);
    }
  });

  const stopDragDefault = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  let dragDepth = 0;
  uploadDropzoneEl.addEventListener("dragenter", (event) => {
    stopDragDefault(event);
    dragDepth += 1;
    uploadDropzoneEl.classList.add("dropzone-active");
  });

  uploadDropzoneEl.addEventListener("dragover", (event) => {
    stopDragDefault(event);
    uploadDropzoneEl.classList.add("dropzone-active");
  });

  uploadDropzoneEl.addEventListener("dragleave", (event) => {
    stopDragDefault(event);
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) {
      uploadDropzoneEl.classList.remove("dropzone-active");
    }
  });

  uploadDropzoneEl.addEventListener("drop", (event) => {
    stopDragDefault(event);
    dragDepth = 0;
    uploadDropzoneEl.classList.remove("dropzone-active");
    if (event.dataTransfer?.files?.length) {
      enqueueFiles(event.dataTransfer.files);
    }
  });

  uploadDropzoneEl.addEventListener("click", () => {
    fileInputEl.click();
  });

  uploadDropzoneEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputEl.click();
    }
  });

  pickFilesBtnEl.addEventListener("click", (event) => {
    event.stopPropagation();
    fileInputEl.click();
  });

  fileInputEl.addEventListener("change", () => {
    if (fileInputEl.files?.length) {
      enqueueFiles(fileInputEl.files);
      fileInputEl.value = "";
    }
  });

  queueClearBtnEl.addEventListener("click", () => {
    uploadQueue.clearFinished();
  });

  uploadQueueListEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!id || action !== "retry") return;
    uploadQueue.retry(id);
  });
}

function enqueueFiles(files: FileList): void {
  if (!getAuthSession().accessToken) {
    setConnectionMessage("请先登录后再上传文件");
    return;
  }
  uploadQueue.enqueue(files);
}

function renderUploadQueue(items: UploadQueueItem[]): void {
  uploadQueueListEl.innerHTML = "";
  uploadQueueEmptyEl.classList.toggle("hidden", items.length > 0);

  for (const item of items) {
    const li = document.createElement("li");
    li.className = `queue-item queue-${item.status}`;

    const head = document.createElement("div");
    head.className = "queue-item-head";

    const name = document.createElement("p");
    name.className = "queue-file-name";
    name.textContent = item.file.name;

    const badge = document.createElement("span");
    badge.className = `queue-state state-${item.status}`;
    badge.textContent = queueStatusText(item.status);

    head.append(name, badge);

    const meta = document.createElement("p");
    meta.className = "queue-meta";
    meta.textContent = `${formatBytes(item.file.size)} · ${item.category}`;

    li.append(head, meta);

    if (item.error) {
      const err = document.createElement("p");
      err.className = "queue-error";
      err.textContent = `失败原因：${item.error}`;
      li.append(err);
    }

    if (item.status === "failed") {
      const retryBtn = document.createElement("button");
      retryBtn.type = "button";
      retryBtn.className = "btn btn-ghost btn-small";
      retryBtn.dataset.action = "retry";
      retryBtn.dataset.id = item.id;
      retryBtn.textContent = "重试";
      li.append(retryBtn);
    }

    uploadQueueListEl.append(li);
  }
}

function queueStatusText(status: UploadQueueStatus): string {
  const labelMap: Record<UploadQueueStatus, string> = {
    queued: "已入队",
    preparing: "准备中",
    uploading: "上传中",
    completing: "确认中",
    done: "完成",
    failed: "失败",
  };
  return labelMap[status];
}

async function refreshItems(): Promise<void> {
  if (!getAuthSession().accessToken) {
    itemsListEl.innerHTML = "";
    itemsEmptyEl.textContent = "请先登录";
    itemsEmptyEl.classList.remove("hidden");
    return;
  }

  itemsLoadingEl.classList.remove("hidden");
  itemsEmptyEl.classList.add("hidden");

  try {
    const items = await listItemDetails(apiClient, 20);
    renderItems(itemsListEl, items, async (fileId) => {
      try {
        const detail = await prepareFileDownload(apiClient, fileId);
        downloadStatusEl.textContent = `下载地址：${detail.downloadUrl}`;
      } catch (error) {
        downloadStatusEl.textContent = `下载地址获取失败：${toErrorMessage(error)}`;
      }
    });

    if (!items.length) {
      itemsEmptyEl.textContent = "暂无条目";
      itemsEmptyEl.classList.remove("hidden");
    }
  } catch (error) {
    itemsListEl.innerHTML = "";
    itemsEmptyEl.textContent = `加载失败：${toErrorMessage(error)}`;
    itemsEmptyEl.classList.remove("hidden");
  } finally {
    itemsLoadingEl.classList.add("hidden");
  }
}

function renderAuthState(): void {
  const session = getAuthSession();
  const isLoggedIn = Boolean(session.accessToken);

  usernameInputEl.disabled = false;
  passwordInputEl.disabled = false;
  logoutBtnEl.disabled = !isLoggedIn;

  authStatusEl.textContent = isLoggedIn
    ? `已登录：${session.username || "unknown"} / 设备 ${getDeviceId()}`
    : "未登录";

  toggleWorkspace(isLoggedIn);

  renderConnectionStatus();
}

function toggleWorkspace(loggedIn: boolean): void {
  authScreenEl.classList.toggle("hidden", loggedIn);
  workspaceEl.classList.toggle("hidden", !loggedIn);
}

function setConnectionMessage(message: string): void {
  connectionStatusEl.textContent = message;
}

function renderConnectionStatus(): void {
  const loggedIn = Boolean(getAuthSession().accessToken);

  if (!loggedIn) {
    setConnectionMessage(`未登录 / API: ${API_BASE_URL}`);
    return;
  }

  const wsMap: Record<RealtimeStatus, string> = {
    idle: "WS 未连接",
    connecting: "WS 连接中",
    open: "WS 已连接",
    closed: "WS 已断开",
    reconnecting: "WS 重连中",
    error: "WS 连接异常",
  };

  setConnectionMessage(`已登录 / ${wsMap[currentWsStatus]} / API: ${API_BASE_URL}`);
}

window.addEventListener("beforeunload", () => {
  realtime.disconnect();
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  if (reason instanceof ApiRequestError) {
    setConnectionMessage(`请求失败：${reason.message}`);
  }
});
