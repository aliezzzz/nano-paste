/**
 * 文件相关契约：prepare-upload / complete / prepare-download
 */

import type { ApiResponse } from './common';

export interface PrepareUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType?: string;
  sha256?: string;
}

export interface PrepareUploadResponse {
  fileId: string;
  uploadUrl: string;
  uploadMethod: 'PUT' | 'POST';
  expiresAt: string;
}

export type PrepareUploadApi = {
  path: '/v1/files/prepare-upload';
  method: 'POST';
  request: PrepareUploadRequest;
  response: ApiResponse<PrepareUploadResponse>;
};

export interface CompleteUploadRequest {
  fileId: string;
  etag?: string;
  sha256?: string;
}

export interface CompleteUploadResponse {
  itemId: string;
  fileId: string;
  ready: true;
}

export type CompleteUploadApi = {
  path: '/v1/files/complete';
  method: 'POST';
  request: CompleteUploadRequest;
  response: ApiResponse<CompleteUploadResponse>;
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

