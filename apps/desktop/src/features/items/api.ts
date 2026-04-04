import type {
  CreateItemResponse,
  DeleteItemResponse,
  FavoriteItemResponse,
  GetItemDetailResponse,
  ItemDetail,
  ListItemsResponse,
  PrepareDownloadResponse,
} from "../../../../../packages/contracts/v1";
import type { ApiClient } from "../../api/client";

export type CreateTextInput = {
  content: string;
  title?: string;
};

export async function createTextItem(client: ApiClient, input: CreateTextInput): Promise<void> {
  await client.request<CreateItemResponse>("/v1/items", {
    method: "POST",
    body: JSON.stringify({
      type: "text",
      content: input.content,
      title: input.title,
      client_event_id: `evt_${Date.now()}`,
    }),
  });
}

type ListItemDetailsOptions = {
  sort?: "favorite";
};

export async function listItemDetails(client: ApiClient, limit: number, options?: ListItemDetailsOptions): Promise<ItemDetail[]> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (options?.sort === "favorite") {
    query.set("sort", "favorite");
  }

  const list = await client.request<ListItemsResponse>(`/v1/items?${query.toString()}`, {
    method: "GET",
  });

  const details = await Promise.all(
    list.items.map(async (summary) => {
      const detail = await client.request<GetItemDetailResponse>(`/v1/items/${encodeURIComponent(summary.id)}`, {
        method: "GET",
      });
      return detail.item;
    }),
  );

  return details;
}

export async function getItemDetail(client: ApiClient, itemId: string): Promise<ItemDetail> {
  const response = await client.request<GetItemDetailResponse>(
    `/v1/items/${encodeURIComponent(itemId)}`,
    { method: "GET" }
  );
  return response.item;
}

export async function prepareFileDownload(client: ApiClient, fileId: string): Promise<PrepareDownloadResponse> {
  return client.request<PrepareDownloadResponse>(`/v1/files/${encodeURIComponent(fileId)}/prepare-download`, {
    method: "POST",
  });
}

export async function deleteItem(client: ApiClient, itemId: string): Promise<void> {
  await client.request<DeleteItemResponse>(`/v1/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}

export async function setItemFavorite(client: ApiClient, itemId: string, favorite: boolean): Promise<void> {
  await client.request<FavoriteItemResponse>(`/v1/items/${encodeURIComponent(itemId)}/favorite`, {
    method: "POST",
    body: JSON.stringify({ favorite }),
  });
}
