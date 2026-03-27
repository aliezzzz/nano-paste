/**
 * 设备相关契约：register / heartbeat / list / revoke
 */

import type { ApiResponse } from './common';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: 'macos' | 'windows' | 'linux' | 'unknown';
  lastSeenAt: string;
  createdAt: string;
  revokedAt?: string;
}

export interface RegisterDeviceRequest {
  deviceName: string;
  platform: DeviceInfo['platform'];
  clientVersion?: string;
}

export interface RegisterDeviceResponse {
  device: DeviceInfo;
}

export type RegisterDeviceApi = {
  path: '/v1/devices/register';
  method: 'POST';
  request: RegisterDeviceRequest;
  response: ApiResponse<RegisterDeviceResponse>;
};

export interface DeviceHeartbeatRequest {
  deviceId: string;
  status?: 'online' | 'idle';
}

export interface DeviceHeartbeatResponse {
  deviceId: string;
  acknowledgedAt: string;
}

export type DeviceHeartbeatApi = {
  path: '/v1/devices/heartbeat';
  method: 'POST';
  request: DeviceHeartbeatRequest;
  response: ApiResponse<DeviceHeartbeatResponse>;
};

export interface ListDevicesRequest { }

export interface ListDevicesResponse {
  devices: DeviceInfo[];
}

export type ListDevicesApi = {
  path: '/v1/devices';
  method: 'GET';
  request: ListDevicesRequest;
  response: ApiResponse<ListDevicesResponse>;
};

export interface RevokeDeviceRequest {
  deviceId: string;
}

export interface RevokeDeviceResponse {
  success: true;
  revokedAt: string;
}

export type RevokeDeviceApi = {
  path: '/v1/devices/:deviceId/revoke';
  method: 'POST';
  request: RevokeDeviceRequest;
  response: ApiResponse<RevokeDeviceResponse>;
};

