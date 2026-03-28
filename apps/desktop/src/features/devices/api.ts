import type { DeviceInfo, ListDevicesResponse, RevokeDeviceResponse } from '../../../../../packages/contracts/v1';
import type { ApiClient } from '../../api/client';

export async function listDevices(client: ApiClient): Promise<DeviceInfo[]> {
  const response = await client.request<ListDevicesResponse>('/v1/devices', {
    method: 'GET',
  });

  return response.devices ?? [];
}

export async function revokeDevice(client: ApiClient, deviceId: string): Promise<void> {
  await client.request<RevokeDeviceResponse>('/v1/devices/revoke', {
    method: 'POST',
    body: JSON.stringify({ deviceId }),
  });
}
