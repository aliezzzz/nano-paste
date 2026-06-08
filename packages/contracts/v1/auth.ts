/**
 * 认证相关契约：login / refresh / logout
 */

import type { ApiResponse, AuthTokenPair } from './common';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user_id: string;
  username: string;
  tokens: AuthTokenPair;
}

export type LoginApi = {
  path: '/v1/auth/login';
  method: 'POST';
  request: LoginRequest;
  response: ApiResponse<LoginResponse>;
};

export interface RefreshRequest {
  refresh_token: string;
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
  refresh_token: string;
  all_sessions?: boolean;
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
