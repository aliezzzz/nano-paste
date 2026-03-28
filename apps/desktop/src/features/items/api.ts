import type {
  CreateItemResponse,
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

export async function listItemDetails(client: ApiClient, limit: number): Promise<ItemDetail[]> {
  const list = await client.request<ListItemsResponse>(`/v1/items?limit=${encodeURIComponent(String(limit))}`, {
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

export async function prepareFileDownload(client: ApiClient, fileId: string): Promise<PrepareDownloadResponse> {
  return client.request<PrepareDownloadResponse>(`/v1/files/${encodeURIComponent(fileId)}/prepare-download`, {
    method: "POST",
  });
}
