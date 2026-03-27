import "./styles.css";
import { createUiShell } from "./ui";
import "./clipboard";
import "./files";
import "./sync";
import "./repository";
import type {
  ApiResponse,
  CompleteUploadRequest,
  CompleteUploadResponse,
  CreateItemRequest,
  CreateItemResponse,
  FileItemDetail,
  GetItemDetailResponse,
  ItemDetail,
  ListItemsResponse,
  NanoPasteWsEvent,
  PrepareDownloadResponse,
  PrepareUploadRequest,
  PrepareUploadResponse,
} from "../../../packages/contracts/v1";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

app.innerHTML = createUiShell();

const MOCK_BASE_URL = "http://localhost:3100";
const MOCK_ACCOUNT = "desktop-demo";
const MOCK_PASSWORD = "mock-password";
const DEVICE_ID = "desktop_mock_client";

let accessToken = "";
let ws: WebSocket | null = null;

const statusEl = mustById<HTMLParagraphElement>("connection-status");
const downloadStatusEl = mustById<HTMLParagraphElement>("download-status");
const itemsLoadingEl = mustById<HTMLParagraphElement>("items-loading");
const itemsListEl = mustById<HTMLUListElement>("items-list");
const itemsEmptyEl = mustById<HTMLParagraphElement>("items-empty");
const textFormEl = mustById<HTMLFormElement>("text-form");
const textInputEl = mustById<HTMLInputElement>("text-input");
const mockUploadBtnEl = mustById<HTMLButtonElement>("mock-upload-btn");

void bootstrap();

function mustById<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
}

async function bootstrap(): Promise<void> {
  setStatus("正在登录 mock-server...");
  await login();
  setStatus("已连接（HTTP 就绪）");

  bindActions();
  connectWs();
  await refreshItems();
}

function bindActions(): void {
  textFormEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = textInputEl.value.trim();
    if (!content) return;

    const request: CreateItemRequest = {
      type: "text",
      content,
    };

    try {
      await apiRequest<CreateItemResponse>("/v1/items", {
        method: "POST",
        body: JSON.stringify(request),
      });
      textInputEl.value = "";
      await refreshItems();
    } catch (error) {
      setStatus(`发送失败：${toErrorMessage(error)}`);
    }
  });

  mockUploadBtnEl.addEventListener("click", async () => {
    const suffix = Math.random().toString(36).slice(2, 8);
    const fileName = `mock-file-${suffix}.txt`;
    const fileSize = 1024 + Math.floor(Math.random() * 4096);

    const prepareBody: PrepareUploadRequest = {
      fileName,
      fileSize,
      mimeType: "text/plain",
    };

    try {
      const prepareResult = await apiRequest<PrepareUploadResponse>("/v1/files/prepare-upload", {
        method: "POST",
        body: JSON.stringify(prepareBody),
      });

      const completeBody: CompleteUploadRequest = {
        fileId: prepareResult.fileId,
      };

      await apiRequest<CompleteUploadResponse>("/v1/files/complete", {
        method: "POST",
        body: JSON.stringify(completeBody),
      });

      setStatus(`已模拟上传：${fileName}`);
      await refreshItems();
    } catch (error) {
      setStatus(`模拟上传失败：${toErrorMessage(error)}`);
    }
  });
}

async function login(): Promise<void> {
  type LoginResponse = {
    userId: string;
    account: string;
    tokens: { accessToken: string; refreshToken: string; expiresInSeconds: number };
  };

  const response = await fetch(`${MOCK_BASE_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account: MOCK_ACCOUNT, password: MOCK_PASSWORD }),
  });

  const payload = (await response.json()) as ApiResponse<LoginResponse>;
  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  accessToken = payload.data.tokens.accessToken;
}

function connectWs(): void {
  if (!accessToken) return;

  const wsBase = MOCK_BASE_URL.replace(/^http/, "ws");
  ws = new WebSocket(`${wsBase}/ws?accessToken=${encodeURIComponent(accessToken)}`);

  ws.addEventListener("open", () => {
    setStatus("已连接（HTTP + WS）");
  });

  ws.addEventListener("close", () => {
    setStatus("WS 已断开（HTTP 可用）");
  });

  ws.addEventListener("message", (event) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(String(event.data));
    } catch {
      return;
    }

    if (!parsed || typeof parsed !== "object" || !("event" in parsed)) {
      return;
    }

    const message = parsed as { event?: string };
    if (message.event === "item_created" || message.event === "item_deleted" || message.event === "file_ready") {
      void onRealtimeEvent(parsed as NanoPasteWsEvent);
    }
  });
}

async function onRealtimeEvent(event: NanoPasteWsEvent): Promise<void> {
  if (event.event === "item_created" || event.event === "item_deleted" || event.event === "file_ready") {
    await refreshItems();
  }
}

async function refreshItems(): Promise<void> {
  itemsLoadingEl.classList.remove("hidden");
  itemsEmptyEl.classList.add("hidden");

  try {
    const list = await apiRequest<ListItemsResponse>(`/v1/items?limit=20`, {
      method: "GET",
    });

    const details = await Promise.all(
      list.items.map(async (summary) => {
        const detail = await apiRequest<GetItemDetailResponse>(`/v1/items/${encodeURIComponent(summary.id)}`, {
          method: "GET",
        });
        return detail.item;
      }),
    );

    renderItems(details);
  } catch (error) {
    itemsListEl.innerHTML = "";
    itemsEmptyEl.textContent = `加载失败：${toErrorMessage(error)}`;
    itemsEmptyEl.classList.remove("hidden");
  } finally {
    itemsLoadingEl.classList.add("hidden");
  }
}

function renderItems(items: ItemDetail[]): void {
  if (!items.length) {
    itemsListEl.innerHTML = "";
    itemsEmptyEl.textContent = "暂无条目";
    itemsEmptyEl.classList.remove("hidden");
    return;
  }

  itemsEmptyEl.classList.add("hidden");

  itemsListEl.innerHTML = items
    .map((item) => {
      if (item.type === "text") {
        return `
          <li class="item-card">
            <div class="item-head">
              <span class="item-type">文本</span>
              <time class="item-time">${new Date(item.createdAt).toLocaleString()}</time>
            </div>
            <p class="item-content">${escapeHtml(item.content)}</p>
          </li>
        `;
      }

      const fileItem = item as FileItemDetail;
      return `
        <li class="item-card">
          <div class="item-head">
            <span class="item-type">文件</span>
            <time class="item-time">${new Date(item.createdAt).toLocaleString()}</time>
          </div>
          <p class="item-content">文件名：${escapeHtml(fileItem.fileName)}</p>
          <p class="item-content">大小：${formatBytes(fileItem.fileSize)}</p>
          <button class="btn btn-small" data-action="download" data-file-id="${escapeHtml(fileItem.fileId)}">下载</button>
        </li>
      `;
    })
    .join("");

  for (const button of itemsListEl.querySelectorAll<HTMLButtonElement>('button[data-action="download"]')) {
    button.addEventListener("click", async () => {
      const fileId = button.dataset.fileId;
      if (!fileId) return;

      try {
        const response = await apiRequest<PrepareDownloadResponse>(
          `/v1/files/${encodeURIComponent(fileId)}/prepare-download`,
          {
            method: "POST",
          },
        );
        downloadStatusEl.textContent = `已获取下载地址（mock）：${response.downloadUrl}`;
      } catch (error) {
        downloadStatusEl.textContent = `下载地址获取失败：${toErrorMessage(error)}`;
      }
    });
  }
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setStatus(message: string): void {
  statusEl.textContent = message;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${MOCK_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "x-device-id": DEVICE_ID,
      ...init.headers,
    },
  });

  const payload = (await response.json()) as ApiResponse<T>;
  if (!payload.ok) {
    throw new Error(payload.error.message);
  }
  return payload.data;
}
