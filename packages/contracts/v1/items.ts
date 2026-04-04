/**
 * 条目相关契约：create / list / detail / delete
 */

import type { ApiResponse, PaginationInput, PaginationMeta } from './common';

export type ItemType = 'text' | 'file';

export interface ItemSummary {
  id: string;
  type: ItemType;
  title?: string;
  isFavorite: boolean;
  createdAt: string;
  createdByDeviceId: string;
}

export interface TextItemDetail extends ItemSummary {
  type: 'text';
  content: string;
}

export interface FileItemDetail extends ItemSummary {
  type: 'file';
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
}

export type ItemDetail = TextItemDetail | FileItemDetail;

export interface CreateItemRequest {
  type: 'text';
  content: string;
  title?: string;
}

export interface CreateItemResponse {
  item: ItemDetail;
}

export type CreateItemApi = {
  path: '/v1/items';
  method: 'POST';
  request: CreateItemRequest;
  response: ApiResponse<CreateItemResponse>;
};

export interface ListItemsRequest extends PaginationInput {
  type?: ItemType;
  sort?: 'favorite';
}

export interface ListItemsResponse {
  items: ItemSummary[];
  page: PaginationMeta;
}

export type ListItemsApi = {
  path: '/v1/items';
  method: 'GET';
  request: ListItemsRequest;
  response: ApiResponse<ListItemsResponse>;
};

export interface GetItemDetailRequest {
  itemId: string;
}

export interface GetItemDetailResponse {
  item: ItemDetail;
}

export type GetItemDetailApi = {
  path: '/v1/items/:itemId';
  method: 'GET';
  request: GetItemDetailRequest;
  response: ApiResponse<GetItemDetailResponse>;
};

export interface DeleteItemRequest {
  itemId: string;
}

export interface DeleteItemResponse {
  success: true;
  deletedAt: string;
}

export type DeleteItemApi = {
  path: '/v1/items/:itemId';
  method: 'DELETE';
  request: DeleteItemRequest;
  response: ApiResponse<DeleteItemResponse>;
};

export interface FavoriteItemRequest {
  itemId: string;
  favorite: boolean;
}

export interface FavoriteItemResponse {
  success: true;
  itemId: string;
  favorite: boolean;
  updatedAt: string;
}

export type FavoriteItemApi = {
  path: '/v1/items/:itemId/favorite';
  method: 'POST';
  request: FavoriteItemRequest;
  response: ApiResponse<FavoriteItemResponse>;
};

