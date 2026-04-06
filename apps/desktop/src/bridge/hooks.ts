import type { RealtimeStatus } from "../realtime/ws";

export interface UploadQueueViewItem {
  id: string;
  fileName: string;
  status: "queued" | "uploading" | "done" | "failed";
  error?: string;
}

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

export interface BridgeHooks {
  onRequireLogin?: () => void;
  onUploadQueueChanged?: (items: UploadQueueViewItem[]) => void;
  onItemsLoadingChanged?: (loading: boolean) => void;
  onItemsChanged?: (items: ItemView[]) => void;
  onActiveDevicesChanged?: (devices: ActiveDeviceView[]) => void;
  onConnectionStatusChanged?: (status: RealtimeStatus) => void;
}

let hooks: BridgeHooks = {};

export function setBridgeHooks(nextHooks: BridgeHooks): void {
  hooks = nextHooks;
}

export function getBridgeHooks(): BridgeHooks {
  return hooks;
}
