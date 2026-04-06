import type { CompleteUploadResponse, PrepareUploadResponse } from "../../../../../packages/contracts/v1";
import { request, requestRaw } from "../../api/request";

interface PrepareUploadInput {
  file: File;
  category?: string;
}

interface CompleteUploadInput {
  fileId: string;
  etag?: string;
}

interface CleanupFilesInput {
  itemIds?: string[];
  reason?: "manual" | "expired";
}

export async function prepareFileUpload(
  { file, category = "other" }: PrepareUploadInput,
): Promise<PrepareUploadResponse> {
  return request<PrepareUploadResponse>({
    url: "/v1/files/prepare-upload",
    method: "POST",
    data: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || undefined,
      category,
    },
  });
}

export async function uploadToSignedUrl(
  uploadUrl: string,
  uploadMethod: "PUT" | "POST",
  file: File,
): Promise<string | undefined> {
  try {
    const response = await requestRaw({
      url: uploadUrl,
      baseURL: "",
      skipBaseUrl: true,
      authRequired: false,
      withDeviceId: false,
      method: uploadMethod,
      data: file,
      headers: file.type
        ? {
          "Content-Type": file.type,
        }
        : undefined,
    });

    return (response.headers.etag as string | undefined) ?? undefined;
  } catch (error) {
    const status =
      typeof error === "object" && error && "status" in error
        ? String((error as { status?: number }).status ?? "UPLOAD_FAILED")
        : "UPLOAD_FAILED";
    throw new Error(`二进制上传失败（${status}）`);
  }
}

export async function completeFileUpload(input: CompleteUploadInput): Promise<CompleteUploadResponse> {
  return request<CompleteUploadResponse>({
    url: "/v1/files/complete",
    method: "POST",
    data: {
      fileId: input.fileId,
      etag: input.etag,
    },
  });
}

export async function cleanupFiles(input: CleanupFilesInput): Promise<void> {
  await request<{ success: boolean }>({
    url: "/v1/files/cleanup",
    method: "POST",
    data: {
      reason: input.reason ?? "manual",
      itemIds: input.itemIds ?? [],
    },
  });
}
