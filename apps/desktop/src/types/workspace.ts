import type { RealtimeStatus } from "../utils/ws";

export interface ItemView {
  id: string;
  type: "text" | "file";
  title?: string;
  content?: string;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  isFavorite: boolean;
  createdAt: string;
  iconSvg: string;
}

export interface ActiveDeviceView {
  deviceId: string;
  deviceName: string;
  platform: string;
  lastSeenAt: string;
  isCurrent: boolean;
}

export type ItemActionType = "copy" | "download" | "delete" | "favorite";

export interface ItemActionPayload {
  id: string;
  action: ItemActionType;
  type: "text" | "file";
  content?: string;
  fileId?: string;
  fileName?: string;
  isFavorite: boolean;
}

export type { RealtimeStatus };
