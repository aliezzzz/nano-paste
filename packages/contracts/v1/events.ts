/**
 * WebSocket 事件契约：item_created / item_deleted / file_ready
 */

export type WsEventType = 'item_created' | 'item_deleted' | 'file_ready';

export interface WsEnvelope<TType extends WsEventType, TPayload> {
  event: TType;
  accountId: string;
  timestamp: string;
  payload: TPayload;
}

export interface ItemCreatedPayload {
  itemId: string;
  type: 'text' | 'file';
  createdAt: string;
}

export type ItemCreatedEvent = WsEnvelope<'item_created', ItemCreatedPayload>;

export interface ItemDeletedPayload {
  itemId: string;
  deletedAt: string;
}

export type ItemDeletedEvent = WsEnvelope<'item_deleted', ItemDeletedPayload>;

/**
 * 文件事件仅广播元数据，不携带文件内容。
 * 客户端需按业务流程再调用 prepare-download 获取下载地址。
 */
export interface FileReadyPayload {
  itemId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  readyAt: string;
}

export type FileReadyEvent = WsEnvelope<'file_ready', FileReadyPayload>;

export type NanoPasteWsEvent = ItemCreatedEvent | ItemDeletedEvent | FileReadyEvent;

