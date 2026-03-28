import type { CompleteUploadResponse, PrepareUploadResponse } from "../../../../../packages/contracts/v1";
import type { ApiClient } from "../../api/client";

interface PrepareUploadInput {
  file: File;
  category?: string;
}

interface CompleteUploadInput {
  fileId: string;
  etag?: string;
}

export async function prepareFileUpload(
  client: ApiClient,
  { file, category = "other" }: PrepareUploadInput,
): Promise<PrepareUploadResponse> {
  return client.request<PrepareUploadResponse>("/v1/files/prepare-upload", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || undefined,
      category,
    }),
  });
}

export async function uploadToSignedUrl(
  uploadUrl: string,
  uploadMethod: "PUT" | "POST",
  file: File,
): Promise<string | undefined> {
  const response = await fetch(uploadUrl, {
    method: uploadMethod,
    body: file,
    headers: file.type
      ? {
        "Content-Type": file.type,
      }
      : undefined,
  });

  if (!response.ok) {
    throw new Error(`二进制上传失败（${response.status} ${response.statusText || "UPLOAD_FAILED"}）`);
  }

  return response.headers.get("etag") ?? undefined;
}

export async function completeFileUpload(client: ApiClient, input: CompleteUploadInput): Promise<CompleteUploadResponse> {
  return client.request<CompleteUploadResponse>("/v1/files/complete", {
    method: "POST",
    body: JSON.stringify({
      fileId: input.fileId,
      etag: input.etag,
    }),
  });
}
