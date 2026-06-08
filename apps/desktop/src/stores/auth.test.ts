import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "./auth";

describe("auth store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("stores and clears the current session", () => {
    const store = useAuthStore();
    store.setSession({ accessToken: "access", refreshToken: "refresh", expiresInSeconds: 3600 }, "demo");

    expect(store.accessToken).toBe("access");
    expect(store.refreshToken).toBe("refresh");
    expect(store.expiresInSeconds).toBe(3600);
    expect(store.username).toBe("demo");
    expect(store.sessionVersion).toBe(1);

    store.clearSession();

    expect(store.accessToken).toBe("");
    expect(store.refreshToken).toBe("");
    expect(store.username).toBe("");
    expect(store.sessionVersion).toBe(2);
  });
});
