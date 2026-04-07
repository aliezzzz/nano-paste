import type {
  CreateItemResponse,
  DeleteItemResponse,
  FavoriteItemResponse,
  ItemDetail,
  ListItemsResponse,
  PrepareDownloadResponse,
} from "../../../../packages/contracts/v1";
import { request } from "../utils/request";

export type CreateTextInput = {
  content: string;
  title?: string;
};

export async function createTextItem(input: CreateTextInput): Promise<void> {
  await request<CreateItemResponse>({
    url: "/v1/items",
    method: "POST",
    data: {
      type: "text",
      content: input.content,
      title: input.title,
      client_event_id: `evt_${Date.now()}`,
    },
  });
}

type ListItemDetailsOptions = {
  sort?: "favorite";
};

export async function listItemDetails(limit: number, options?: ListItemDetailsOptions): Promise<ItemDetail[]> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (options?.sort === "favorite") {
    query.set("sort", "favorite");
  }

  const list = await request<ListItemsResponse>({
    url: `/v1/items?${query.toString()}`,
    method: "GET",
  });

  return list.items;
}

export async function prepareFileDownload(fileId: string): Promise<PrepareDownloadResponse> {
  return request<PrepareDownloadResponse>({
    url: `/v1/files/${encodeURIComponent(fileId)}/prepare-download`,
    method: "POST",
  });
}

export async function deleteItem(itemId: string): Promise<void> {
  await request<DeleteItemResponse>({
    url: `/v1/items/${encodeURIComponent(itemId)}`,
    method: "DELETE",
  });
}

export async function setItemFavorite(itemId: string, favorite: boolean): Promise<void> {
  await request<FavoriteItemResponse>({
    url: `/v1/items/${encodeURIComponent(itemId)}/favorite`,
    method: "POST",
    data: { favorite },
  });
}
