/**
 * NanoPaste v1 通用契约定义
 * 仅用于类型契约，不包含任何业务实现。
 */

import type { ApiError } from './errors';

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  requestId?: string;
}

export interface ApiFailure {
  ok: false;
  error: ApiError;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/**
 * 统一规则契约（供服务端、桌面端、Mock 共同对齐）
 */
export interface ContractRulesV1 {
  /** 同账号可见 */
  accountVisibility: 'same_account_only';
  /** 文本实时广播 */
  textBroadcast: 'realtime';
  /** 文件只广播元数据，点击下载 */
  fileBroadcast: 'metadata_only_click_to_download';
  /** 云端文件 90 天保留，可主动清理 */
  cloudFileRetention: '90_days_with_manual_cleanup';
}

export const CONTRACT_RULES_V1: ContractRulesV1 = {
  accountVisibility: 'same_account_only',
  textBroadcast: 'realtime',
  fileBroadcast: 'metadata_only_click_to_download',
  cloudFileRetention: '90_days_with_manual_cleanup',
};

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface PaginationInput {
  cursor?: string;
  limit?: number;
}

export interface PaginationMeta {
  nextCursor?: string;
  hasMore: boolean;
}

