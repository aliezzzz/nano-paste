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
  downloadUrl: string;
  expiresAt: string;
}

export type PrepareDownloadApi = {
  path: '/v1/files/:fileId/prepare-download';
  method: 'POST';
  request: PrepareDownloadRequest;
  response: ApiResponse<PrepareDownloadResponse>;
};
