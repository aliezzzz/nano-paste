import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useRuntimeStore, resolveApiUrl } from "./runtime";

describe("runtime store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("uses the configured default backend url", () => {
    const store = useRuntimeStore();
    expect(store.apiBaseUrl).toBe("http://localhost:8080");
  });

  it("resolves relative api paths against the configured base url", () => {
    expect(resolveApiUrl("/v1/items")).toBe("http://localhost:8080/v1/items");
    expect(resolveApiUrl("v1/items")).toBe("http://localhost:8080/v1/items");
    expect(resolveApiUrl("https://other.example/v1/items")).toBe("https://other.example/v1/items");
  });
});
