import { createTextItem, deleteItem, getItemDetail, prepareFileDownload, setItemFavorite } from "../features/items/api";
import { cleanupFiles } from "../features/files/api";
import { copyTextToClipboard, triggerFileDownload } from "./platform";
import type { ApiClient } from "../api/client";

type ApiClientGetter = () => ApiClient | null;
type ReloadItems = () => Promise<void>;
type OnFavoriteChanged = (id: string, favorite: boolean) => void;

export async function sendText(
  getApiClient: ApiClientGetter,
  payload: { title?: string; content: string },
  reloadItems: ReloadItems,
): Promise<void> {
  const content = payload.content?.trim();
  if (!content) {
    throw new Error("请输入内容");
  }

  const apiClient = getApiClient();
  if (!apiClient) {
    throw new Error("API 客户端未初始化，请重新登录");
  }

  await createTextItem(apiClient, {
    title: payload.title,
    content,
  });
  await reloadItems();
}

export async function handleItemAction(
  getApiClient: ApiClientGetter,
  id: string,
  action: "copy" | "download" | "delete" | "favorite",
  reloadItems: ReloadItems,
  copyContent?: string,
  onFavoriteChanged?: OnFavoriteChanged,
): Promise<void> {
  const apiClient = getApiClient();
  if (!apiClient) {
    throw new Error("API 客户端未初始化");
  }

  if (action === "delete") {
    const item = await getItemDetail(apiClient, id);
    if (item.type === "file") {
      await cleanupFiles(apiClient, { itemIds: [id], reason: "manual" });
    } else {
      await deleteItem(apiClient, id);
    }
    await reloadItems();
    return;
  }

  if (action === "copy") {
    if (typeof copyContent === "string" && copyContent.length > 0) {
      await copyTextToClipboard(copyContent);
      return;
    }

    const item = await getItemDetail(apiClient, id);
    if (item.type !== "text" || !item.content) {
      throw new Error("无法复制此内容");
    }
    await copyTextToClipboard(item.content);
    return;
  }

  if (action === "download") {
    const item = await getItemDetail(apiClient, id);
    if (item.type !== "file" || !item.fileId) {
      throw new Error("不是可下载的文件条目");
    }

    const prepared = await prepareFileDownload(apiClient, item.fileId);
    await triggerFileDownload(prepared.downloadUrl, prepared.fileName || item.fileName || "download.bin");
    return;
  }

  if (action === "favorite") {
    const item = await getItemDetail(apiClient, id);
    const nextFavorite = !item.isFavorite;
    await setItemFavorite(apiClient, id, nextFavorite);
    onFavoriteChanged?.(id, nextFavorite);
  }
}
