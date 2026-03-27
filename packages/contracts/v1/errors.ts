/**
 * NanoPaste v1 统一错误码契约
 * 仅用于接口契约定义，不包含任何运行逻辑。
 */

export const ERROR_CODES = [
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMIT',
  'INTERNAL',
  'VALIDATION_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ApiError {
  code: ErrorCode;
  message: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

