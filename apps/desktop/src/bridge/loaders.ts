import { getAuthSession } from "../auth/store";
import { listItemDetails } from "../features/items/api";
import { listDevices } from "../features/devices/api";
import { getItemIconSvg } from "./item-icons";
import type { ApiClient } from "../api/client";
import type { ActiveDeviceView, BridgeHooks, ItemView } from "./hooks";

type ApiClientGetter = () => ApiClient | null;
type HooksGetter = () => BridgeHooks;

export function createItemsLoader(getApiClient: ApiClientGetter, getHooks: HooksGetter): () => Promise<void> {
  return async () => {
    const hooks = getHooks();
    if (!hooks.onItemsChanged) return;

    try {
      hooks.onItemsLoadingChanged?.(true);

      const apiClient = getApiClient();
      if (!apiClient) {
        throw new Error("API client is not initialized");
      }

      const items = await listItemDetails(apiClient, 50, { sort: "favorite" });
      const mappedItems: ItemView[] = items.map((item) => ({
        id: String(item.id),
        type: item.type,
        title: item.title,
        content: item.type === "text" ? item.content : undefined,
        fileName: item.type === "file" ? item.fileName : undefined,
        fileSize: item.type === "file" ? item.fileSize : undefined,
        isFavorite: item.isFavorite,
        createdAt: item.createdAt,
        iconSvg: getItemIconSvg(item),
      }));

      hooks.onItemsChanged?.(mappedItems);
      hooks.onItemsLoadingChanged?.(false);
    } catch (err) {
      hooks.onItemsLoadingChanged?.(false);
      console.error("加载条目失败:", err);
    }
  };
}

export async function loadActiveDevices(getApiClient: ApiClientGetter): Promise<ActiveDeviceView[]> {
  const apiClient = getApiClient();
  if (!apiClient) {
    return [];
  }

  const devices = await listDevices(apiClient);
  const activeDevices = devices.filter((device) => !device.revokedAt);
  const currentDeviceId = getAuthSession().deviceId;

  return activeDevices.map((device) => ({
    deviceId: device.deviceId,
    deviceName: device.deviceName || "未命名设备",
    platform: device.platform,
    lastSeenAt: device.lastSeenAt,
    isCurrent: device.deviceId === currentDeviceId,
  }));
}
