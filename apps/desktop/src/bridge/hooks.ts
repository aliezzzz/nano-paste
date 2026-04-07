import type { RealtimeStatus } from "../utils/ws";
import type { ItemView, ActiveDeviceView } from "../types/workspace";

export type { ItemView, ActiveDeviceView };

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
