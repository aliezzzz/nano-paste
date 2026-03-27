/**
 * 认证相关契约：login / refresh / logout
 */

import type { ApiResponse, AuthTokenPair } from './common';

export interface LoginRequest {
  account: string;
  password: string;
  deviceName?: string;
}

export interface LoginResponse {
  userId: string;
  account: string;
  tokens: AuthTokenPair;
}

export type LoginApi = {
  path: '/v1/auth/login';
  method: 'POST';
  request: LoginRequest;
  response: ApiResponse<LoginResponse>;
};

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  tokens: AuthTokenPair;
}

export type RefreshApi = {
  path: '/v1/auth/refresh';
  method: 'POST';
  request: RefreshRequest;
  response: ApiResponse<RefreshResponse>;
};

export interface LogoutRequest {
  refreshToken: string;
  allDevices?: boolean;
}

export interface LogoutResponse {
  success: true;
}

export type LogoutApi = {
  path: '/v1/auth/logout';
  method: 'POST';
  request: LogoutRequest;
  response: ApiResponse<LogoutResponse>;
};

