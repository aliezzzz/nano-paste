import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("../api/files", () => ({
  uploadFileDirect: vi.fn(async () => ({ itemId: "item-1", fileId: "file-1", ready: true, category: "other" })),
}));

import { useUploadQueueStore } from "./upload-queue";

describe("upload queue store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("can cancel a queued upload", () => {
    const store = useUploadQueueStore();
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });

    store.enqueue([file], { autoStart: false });
    const id = store.queueViewItems[0].id;
    store.cancel(id);

    expect(store.queueViewItems[0]).toMatchObject({
      id,
      fileName: "hello.txt",
      status: "cancelled",
      progress: 0,
    });
  });
});
