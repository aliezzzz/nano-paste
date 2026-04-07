import { createTextItem, deleteItem, prepareFileDownload, setItemFavorite } from "../api/items";
import { cleanupFiles } from "../api/files";
import { resolveApiUrl } from "../stores/runtime";
import { copyTextToClipboard } from "../utils/clipboard";
import { triggerFileDownload } from "../utils/download";

type ReloadItems = () => Promise<void>;
type OnFavoriteChanged = (id: string, favorite: boolean) => void;

export type ItemActionPayload = {
  id: string;
  action: "copy" | "download" | "delete" | "favorite";
  type: "text" | "file";
  content?: string;
  fileId?: string;
  fileName?: string;
  isFavorite: boolean;
};

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
  payload: ItemActionPayload,
  reloadItems: ReloadItems,
  onFavoriteChanged?: OnFavoriteChanged,
): Promise<void> {
  const { id, action } = payload;

  if (action === "delete") {
    if (payload.type === "file") {
      await cleanupFiles({ itemIds: [id], reason: "manual" });
    } else {
      await deleteItem(id);
    }
    await reloadItems();
    return;
  }

  if (action === "copy") {
    if (payload.type !== "text") {
      throw new Error("无法复制此内容");
    }
    if (!payload.content) {
      throw new Error("文本内容为空");
    }

    if (typeof payload.content === "string" && payload.content.length > 0) {
      await copyTextToClipboard(payload.content);
      return;
    }
    return;
  }

  if (action === "download") {
    if (payload.type !== "file" || !payload.fileId) {
      throw new Error("不是可下载的文件条目");
    }

	const prepared = await prepareFileDownload(payload.fileId);
	await triggerFileDownload(
		resolveApiUrl(prepared.downloadUrl),
		prepared.fileName || payload.fileName || "download.bin",
	);
	return;
}

  if (action === "favorite") {
    const nextFavorite = !payload.isFavorite;
    await setItemFavorite(id, nextFavorite);
    onFavoriteChanged?.(id, nextFavorite);
  }
}
