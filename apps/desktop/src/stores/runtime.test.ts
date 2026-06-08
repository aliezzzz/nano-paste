import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useRuntimeStore, resolveApiUrl } from "./runtime";

describe("runtime store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("normalizes and validates backend urls", () => {
    const store = useRuntimeStore();
    store.setApiBaseUrl("http://localhost:8080///");
    expect(store.apiBaseUrl).toBe("http://localhost:8080");
    expect(() => store.setApiBaseUrl("ftp://localhost")).toThrow("后端地址必须是合法的 http/https URL");
  });

  it("resolves relative api paths against runtime base url", () => {
    const store = useRuntimeStore();
    store.setApiBaseUrl("https://nano.example/api");
    expect(resolveApiUrl("/v1/items")).toBe("https://nano.example/api/v1/items");
    expect(resolveApiUrl("v1/items")).toBe("https://nano.example/api/v1/items");
    expect(resolveApiUrl("https://other.example/v1/items")).toBe("https://other.example/v1/items");
  });
});
