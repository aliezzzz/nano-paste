import { createTextItem, deleteItem, getItemDetail, prepareFileDownload, setItemFavorite } from "../features/items/api";
import { cleanupFiles } from "../features/files/api";
import { copyTextToClipboard, triggerFileDownload } from "./platform";

type ReloadItems = () => Promise<void>;
type OnFavoriteChanged = (id: string, favorite: boolean) => void;

export async function sendText(
  payload: { title?: string; content: string },
  reloadItems: ReloadItems,
): Promise<void> {
  const content = payload.content?.trim();
  if (!content) {
    throw new Error("请输入内容");
  }

  await createTextItem({
    title: payload.title,
    content,
  });
  await reloadItems();
}

export async function handleItemAction(
  id: string,
  action: "copy" | "download" | "delete" | "favorite",
  reloadItems: ReloadItems,
  copyContent?: string,
  onFavoriteChanged?: OnFavoriteChanged,
): Promise<void> {
  if (action === "delete") {
    const item = await getItemDetail(id);
    if (item.type === "file") {
      await cleanupFiles({ itemIds: [id], reason: "manual" });
    } else {
      await deleteItem(id);
    }
    await reloadItems();
    return;
  }

  if (action === "copy") {
    if (typeof copyContent === "string" && copyContent.length > 0) {
      await copyTextToClipboard(copyContent);
      return;
    }

    const item = await getItemDetail(id);
    if (item.type !== "text" || !item.content) {
      throw new Error("无法复制此内容");
    }
    await copyTextToClipboard(item.content);
    return;
  }

  if (action === "download") {
    const item = await getItemDetail(id);
    if (item.type !== "file" || !item.fileId) {
      throw new Error("不是可下载的文件条目");
    }

    const prepared = await prepareFileDownload(item.fileId);
    await triggerFileDownload(prepared.downloadUrl, prepared.fileName || item.fileName || "download.bin");
    return;
  }

  if (action === "favorite") {
    const item = await getItemDetail(id);
    const nextFavorite = !item.isFavorite;
    await setItemFavorite(id, nextFavorite);
    onFavoriteChanged?.(id, nextFavorite);
  }
}
