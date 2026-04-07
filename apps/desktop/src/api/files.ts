import type { UploadFileResponse } from "../../../../packages/contracts/v1";
import { request } from "../utils/request";

interface UploadFileInput {
  file: File;
  category?: string;
}

interface CleanupFilesInput {
  itemIds?: string[];
  reason?: "manual" | "expired";
}

export async function uploadFileDirect({ file, category = "other" }: UploadFileInput): Promise<UploadFileResponse> {
  const data = new FormData();
  data.append("file", file);
  data.append("category", category);

  return request<UploadFileResponse>({
    url: "/v1/files/upload",
    method: "POST",
    data,
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
