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

export interface BridgeHooks {
  onRequireLogin?: () => void;
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
