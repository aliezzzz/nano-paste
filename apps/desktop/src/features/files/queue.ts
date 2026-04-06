import { toErrorMessage } from "../../shared/errors";
import { completeFileUpload, prepareFileUpload, uploadToSignedUrl } from "./api";

export type UploadQueueStatus = "queued" | "preparing" | "uploading" | "completing" | "done" | "failed";

export interface UploadQueueItem {
  id: string;
  file: File;
  status: UploadQueueStatus;
  category: string;
  fileId?: string;
  error?: string;
}

interface UploadQueueCallbacks {
  onChange: (items: UploadQueueItem[]) => void;
  onUploadCompleted?: (item: UploadQueueItem) => void;
}

interface UploadQueue {
  enqueue: (files: FileList | File[]) => void;
  retry: (id: string) => void;
  clearFinished: () => void;
  getItems: () => UploadQueueItem[];
}

export function createUploadQueue(callbacks: UploadQueueCallbacks): UploadQueue {
  const items: UploadQueueItem[] = [];
  let processing = false;

  const emit = (): void => {
    callbacks.onChange([...items]);
  };

  const updateItem = (id: string, patch: Partial<UploadQueueItem>): UploadQueueItem | undefined => {
    const idx = items.findIndex((item) => item.id === id);
    if (idx < 0) return undefined;
    items[idx] = { ...items[idx], ...patch };
    emit();
    return items[idx];
  };

  const runNext = async (): Promise<void> => {
    if (processing) return;
    const next = items.find((item) => item.status === "queued");
    if (!next) return;

    processing = true;
    try {
      await processItem(next.id);
    } finally {
      processing = false;
      void runNext();
    }
  };

  const processItem = async (id: string): Promise<void> => {
    const current = updateItem(id, { status: "preparing", error: undefined });
    if (!current) return;

    try {
      const prepared = await prepareFileUpload({
        file: current.file,
        category: current.category,
      });
      updateItem(id, {
        status: "uploading",
        fileId: prepared.fileId,
      });

      const method = prepared.uploadMethod === "POST" ? "POST" : "PUT";
      const etag = await uploadToSignedUrl(prepared.uploadUrl, method, current.file);

      updateItem(id, { status: "completing" });
      await completeFileUpload({
        fileId: prepared.fileId,
        etag,
      });

      const done = updateItem(id, {
        status: "done",
        error: undefined,
      });
      if (done) {
        callbacks.onUploadCompleted?.(done);
      }
    } catch (error) {
      const reason = toErrorMessage(error);
      const maybeCors = /network|failed to fetch|cors|fetch/i.test(reason)
        ? "，可能是跨域/签名地址不可达，请检查后端或 mock 配置"
        : "";
      updateItem(id, {
        status: "failed",
        error: `${reason}${maybeCors}`,
      });
    }
  };

  return {
    enqueue(files) {
      const incoming = Array.from(files);
      if (!incoming.length) return;

      for (const file of incoming) {
        items.push({
          id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
          file,
          status: "queued",
          category: "other",
        });
      }
      emit();
      void runNext();
    },
    retry(id) {
      const target = items.find((item) => item.id === id);
      if (!target || target.status !== "failed") return;

      target.status = "queued";
      target.error = undefined;
      emit();
      void runNext();
    },
    clearFinished() {
      const next = items.filter((item) => item.status !== "done" && item.status !== "failed");
      items.splice(0, items.length, ...next);
      emit();
    },
    getItems() {
      return [...items];
    },
  };
}
