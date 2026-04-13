import { DEFAULT_API_BASE_URL } from "../src/constants/extension-storage";
import {
  readAuthStorage,
  readRuntimeApiBaseUrl,
  writeAuthStorage,
} from "../src/utils/extension-storage";

const MENU_ID = "nanopaste-send";
const MENU_TITLE = "发送到 NanoPaste";
const NOTIFICATION_ICON = "icon.png";

chrome.runtime.onInstalled.addListener(() => {
  void createContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  void createContextMenu();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (String(info.menuItemId) !== MENU_ID) {
    return;
  }

  void handleSendToNanoPaste(info, tab);
});

void createContextMenu();

async function createContextMenu(): Promise<void> {
  await new Promise<void>((resolve) => {
    chrome.contextMenus.removeAll(() => resolve());
  });

  chrome.contextMenus.create({
    id: MENU_ID,
    title: MENU_TITLE,
    contexts: ["selection", "image", "link", "page", "frame"],
  });
}

async function handleSendToNanoPaste(
  info: {
    mediaType?: string;
    srcUrl?: string;
    selectionText?: string;
    linkUrl?: string;
    pageUrl?: string;
    frameUrl?: string;
  },
  tab?: { id?: number; title?: string; url?: string },
): Promise<void> {
  const pageTitle = (tab?.title ?? "网页").trim() || "网页";
  const pageUrl = (tab?.url ?? info.pageUrl ?? info.frameUrl ?? "").trim();

  try {
    if (info.mediaType === "image" && info.srcUrl) {
      try {
        await uploadImageToNanoPaste(info.srcUrl);
        await notify("NanoPaste", "已发送图片文件");
        return;
      } catch {
        const fallbackContent = buildImageFallbackContent(pageTitle, info.srcUrl);
        await createTextItem(fallbackContent, pageTitle);
        await notify("NanoPaste", "图片文件发送失败，已改为发送链接文本");
        return;
      }
    }

    const content = buildTextContent(info, pageTitle, pageUrl);
    if (!content) {
      await notify("NanoPaste", "没有可发送的内容");
      return;
    }

    await createTextItem(content, pageTitle);
    await notify("NanoPaste", "已发送到 NanoPaste");
  } catch (error) {
    const message = error instanceof Error ? error.message : "发送失败";
    await notify("NanoPaste", message);
    await openPopupIfPossible();
  }
}

function buildTextContent(
  info: {
    selectionText?: string;
    linkUrl?: string;
  },
  pageTitle: string,
  pageUrl: string,
): string {
  const selected = (info.selectionText ?? "").trim();
  if (selected) {
    return selected;
  }

  const linkUrl = (info.linkUrl ?? "").trim();
  if (linkUrl) {
    return `${pageTitle}\n${linkUrl}`;
  }

  if (!pageUrl) {
    return pageTitle;
  }

  return `${pageTitle}\n${pageUrl}`;
}

function buildImageFallbackContent(pageTitle: string, imageUrl: string): string {
  return `${pageTitle}\n${imageUrl}`;
}

async function uploadImageToNanoPaste(imageUrl: string): Promise<void> {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error("无法读取图片内容");
  }

  const imageBlob = await imageResponse.blob();
  const contentType = (imageBlob.type || "application/octet-stream").trim();
  const fileName = deriveImageFileName(imageUrl, contentType);
  const formData = new FormData();
  formData.append("file", imageBlob, fileName);
  formData.append("category", "image");

  await requestWithAuth<unknown>("/v1/files/upload", {
    method: "POST",
    body: formData,
  });
}

async function createTextItem(content: string, title?: string): Promise<void> {
  const normalized = content.trim();
  if (!normalized) {
    throw new Error("没有可发送的内容");
  }

  await requestWithAuth<unknown>("/v1/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "text",
      title,
      content: normalized,
      client_event_id: `chrome_${Date.now()}`,
    }),
  });
}

async function requestWithAuth<T>(path: string, init: RequestInit): Promise<T> {
  const apiBaseUrl = await readRuntimeApiBaseUrl();
  const authSnapshot = await readAuthStorage();
  let accessToken = authSnapshot.accessToken;

  if (!accessToken) {
    const refreshed = await tryRefreshAuthToken(apiBaseUrl || DEFAULT_API_BASE_URL, authSnapshot.refreshToken, authSnapshot.username);
    if (!refreshed) {
      throw new Error("请先登录 NanoPaste");
    }
    accessToken = refreshed.accessToken;
  }

  let response = await fetchWithAuth(apiBaseUrl || DEFAULT_API_BASE_URL, path, init, accessToken);
  if (response.status !== 401) {
    return parseApiResponse<T>(response);
  }

  const refreshed = await tryRefreshAuthToken(apiBaseUrl || DEFAULT_API_BASE_URL, authSnapshot.refreshToken, authSnapshot.username);
  if (!refreshed) {
    throw new Error("登录已失效，请重新登录 NanoPaste");
  }

  response = await fetchWithAuth(apiBaseUrl || DEFAULT_API_BASE_URL, path, init, refreshed.accessToken);
  return parseApiResponse<T>(response);
}

async function fetchWithAuth(
  apiBaseUrl: string,
  path: string,
  init: RequestInit,
  accessToken: string,
): Promise<Response> {
  const url = `${apiBaseUrl.replace(/\/+$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(init.headers ?? {});
  headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(url, {
    ...init,
    headers,
  });
}

async function tryRefreshAuthToken(
  apiBaseUrl: string,
  refreshToken: string,
  username: string,
): Promise<{ accessToken: string } | null> {
  const normalizedRefreshToken = refreshToken.trim();
  if (!normalizedRefreshToken) {
    return null;
  }

  const url = `${apiBaseUrl.replace(/\/+$/, "")}/v1/auth/refresh`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: normalizedRefreshToken,
      refreshToken: normalizedRefreshToken,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json() as {
    ok?: boolean;
    data?: {
      tokens?: {
        access_token?: string;
        refresh_token?: string;
        expires_in_seconds?: number;
        accessToken?: string;
        refreshToken?: string;
        expiresInSeconds?: number;
      };
    };
  };

  if (!payload?.ok || !payload.data?.tokens) {
    return null;
  }

  const accessToken = payload.data.tokens.access_token ?? payload.data.tokens.accessToken ?? "";
  const nextRefreshToken = payload.data.tokens.refresh_token ?? payload.data.tokens.refreshToken ?? "";
  const expiresInSeconds = payload.data.tokens.expires_in_seconds ?? payload.data.tokens.expiresInSeconds ?? 0;

  if (!accessToken || !nextRefreshToken || !expiresInSeconds) {
    return null;
  }

  await writeAuthStorage({
    accessToken,
    refreshToken: nextRefreshToken,
    expiresInSeconds,
    username,
  });

  return { accessToken };
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json() as {
    ok?: boolean;
    data?: T;
    error?: { message?: string };
  };

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error?.message || `请求失败 (${response.status})`);
  }

  return payload.data as T;
}

async function notify(title: string, message: string): Promise<void> {
  await new Promise<void>((resolve) => {
    chrome.notifications.create({
      type: "basic",
      iconUrl: NOTIFICATION_ICON,
      title,
      message,
    }, () => resolve());
  });
}

async function openPopupIfPossible(): Promise<void> {
  if (typeof chrome.action.openPopup !== "function") {
    return;
  }

  try {
    await chrome.action.openPopup();
  } catch {
    // no-op
  }
}

function deriveImageFileName(imageUrl: string, mimeType: string): string {
  const fallbackExtension = extensionFromMimeType(mimeType);

  try {
    const parsed = new URL(imageUrl);
    const pathSegment = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
    const fileName = decodeURIComponent(pathSegment).trim();
    if (fileName) {
      return fileName;
    }
  } catch {
    // ignored
  }

  return `image_${Date.now()}${fallbackExtension}`;
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes("png")) return ".png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return ".jpg";
  if (mimeType.includes("webp")) return ".webp";
  if (mimeType.includes("gif")) return ".gif";
  return ".bin";
}
