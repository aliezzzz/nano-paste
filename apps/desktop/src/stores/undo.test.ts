import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useUndoStore } from "./undo";

describe("undo store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.spyOn(Date, "now").mockReturnValue(1000);
  });

  it("stores and clears the latest undo action", () => {
    const store = useUndoStore();
    store.push("已删除，可撤销");

    expect(store.lastAction?.label).toBe("已删除，可撤销");
    expect(store.lastAction?.createdAt).toBe(1000);

    store.clear();
    expect(store.lastAction).toBeNull();
  });
});
