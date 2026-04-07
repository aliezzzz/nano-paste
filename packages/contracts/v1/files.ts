/**
 * 文件相关契约：upload / prepare-download
 */

import type { ApiResponse } from './common';

export interface UploadFileResponse {
  itemId: string;
  fileId: string;
  ready: true;
  category: string;
}

export type UploadFileApi = {
  path: '/v1/files/upload';
  method: 'POST';
  request: FormData;
  response: ApiResponse<UploadFileResponse>;
};

export interface PrepareDownloadRequest {
  fileId: string;
}

export interface PrepareDownloadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  // 相对下载路径，例如 /v1/files/download/{fileId}?access_token=...
  downloadUrl: string;
  expiresAt: string;
}

export type PrepareDownloadApi = {
  path: '/v1/files/:fileId/prepare-download';
  method: 'POST';
  request: PrepareDownloadRequest;
  response: ApiResponse<PrepareDownloadResponse>;
};
