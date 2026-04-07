import type { DeviceInfo, ListDevicesResponse, RevokeDeviceResponse } from "../../../../packages/contracts/v1";
import { request } from "../utils/request";

export async function listDevices(): Promise<DeviceInfo[]> {
  const response = await request<ListDevicesResponse>({
    url: "/v1/devices",
    method: "GET",
  });

  return response.devices ?? [];
}

export async function revokeDevice(deviceId: string): Promise<void> {
  await request<RevokeDeviceResponse>({
    url: "/v1/devices/revoke",
    method: "POST",
    data: { deviceId },
  });
}
