import { defineStore } from "pinia";
import { uploadFileDirect } from "../api/files";
import { toErrorMessage } from "../utils/errors";

const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;

export type UploadQueueStatus = "queued" | "uploading" | "done" | "failed";

interface UploadQueueItem {
  id: string;
  file: File;
  status: UploadQueueStatus;
  category: string;
  fileId?: string;
  error?: string;
}

export interface UploadQueueViewItem {
  id: string;
  fileName: string;
  status: UploadQueueStatus;
  error?: string;
}

interface UploadQueueState {
  items: UploadQueueItem[];
  processing: boolean;
  completedVersion: number;
}

export const useUploadQueueStore = defineStore("upload-queue", {
  state: (): UploadQueueState => ({
    items: [],
    processing: false,
    completedVersion: 0,
  }),
  getters: {
    queueViewItems: (state): UploadQueueViewItem[] => state.items.map((item) => ({
      id: item.id,
      fileName: item.file.name,
      status: item.status,
      error: item.error,
    })),
  },
  actions: {
    enqueue(files: FileList | File[]): void {
      const incoming = Array.from(files);
      if (!incoming.length) return;

      for (const file of incoming) {
        if (file.size > MAX_UPLOAD_SIZE_BYTES) {
          this.items.push({
            id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
            file,
            status: "failed",
            category: "other",
            error: `文件超过限制（最大 ${Math.floor(MAX_UPLOAD_SIZE_BYTES / 1024 / 1024)} MB）`,
          });
          continue;
        }

        this.items.push({
          id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
          file,
          status: "queued",
          category: "other",
        });
      }
      void this.runNext();
    },
    retry(id: string): void {
      const target = this.items.find((item) => item.id === id);
      if (!target || target.status !== "failed") return;

      target.status = "queued";
      target.error = undefined;
      void this.runNext();
    },
    clearFinished(): void {
      this.items = this.items.filter((item) => item.status !== "done" && item.status !== "failed");
    },
    reset(): void {
      this.items = [];
      this.processing = false;
      this.completedVersion = 0;
    },
    async runNext(): Promise<void> {
      if (this.processing) return;
      const next = this.items.find((item) => item.status === "queued");
      if (!next) return;

      this.processing = true;
      try {
        await this.processItem(next.id);
      } finally {
        this.processing = false;
        void this.runNext();
      }
    },
    async processItem(id: string): Promise<void> {
      const current = this.updateItem(id, { status: "uploading", error: undefined });
      if (!current) return;

      try {
        const uploaded = await uploadFileDirect({
          file: current.file,
          category: current.category,
        });
        this.updateItem(id, {
          status: "uploading",
          fileId: uploaded.fileId,
        });

        const done = this.updateItem(id, {
          status: "done",
          error: undefined,
        });
        if (done) {
          this.completedVersion += 1;
        }
      } catch (error) {
        const reason = toErrorMessage(error);
        this.updateItem(id, {
          status: "failed",
          error: reason,
        });
      }
    },
    updateItem(id: string, patch: Partial<UploadQueueItem>): UploadQueueItem | undefined {
      const idx = this.items.findIndex((item) => item.id === id);
      if (idx < 0) return undefined;
      this.items[idx] = { ...this.items[idx], ...patch };
      return this.items[idx];
    },
  },
});
