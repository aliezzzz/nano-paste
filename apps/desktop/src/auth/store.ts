import { defineStore } from "pinia";
import { pinia } from "../stores/pinia";

export interface AuthSessionState {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  username: string;
  deviceId: string;
  sessionVersion: number;
}

export interface TokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

const AUTH_STORAGE_KEY = "nanopaste.desktop.auth";
const REMEMBERED_DEVICE_ID_STORAGE_KEY = "nanopaste.desktop.device_id";

interface AuthStoreState {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  username: string;
  deviceId: string;
  rememberedDeviceId: string;
  sessionVersion: number;
}

const useAuthStateStore = defineStore("auth", {
  state: (): AuthStoreState => ({
    accessToken: "",
    refreshToken: "",
    expiresInSeconds: 0,
    username: "",
    deviceId: "",
    rememberedDeviceId: "",
    sessionVersion: 0,
  }),
  actions: {
    syncRememberedDeviceIdFromLegacyStorage(): void {
      if (this.rememberedDeviceId) {
        return;
      }
      const raw = localStorage.getItem(REMEMBERED_DEVICE_ID_STORAGE_KEY) ?? "";
      this.rememberedDeviceId = raw.trim();
    },
    setSession(tokens: TokenBundle, username?: string, deviceId?: string): void {
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      this.expiresInSeconds = tokens.expiresInSeconds;
      if (typeof username === "string") {
        this.username = username;
      }
      if (typeof deviceId === "string") {
        const normalizedDeviceId = deviceId.trim();
        this.deviceId = normalizedDeviceId;
        if (normalizedDeviceId) {
          this.rememberedDeviceId = normalizedDeviceId;
          localStorage.setItem(REMEMBERED_DEVICE_ID_STORAGE_KEY, normalizedDeviceId);
        }
      }
      this.sessionVersion += 1;
    },
    clearSession(): void {
      this.accessToken = "";
      this.refreshToken = "";
      this.expiresInSeconds = 0;
      this.username = "";
      this.deviceId = "";
      this.sessionVersion += 1;
    },
  },
  persist: {
    key: AUTH_STORAGE_KEY,
    storage: localStorage,
  },
});

function getAuthStore(): ReturnType<typeof useAuthStateStore> {
  const store = useAuthStateStore(pinia);
  store.syncRememberedDeviceIdFromLegacyStorage();
  return store;
}

export function getAuthSession(): AuthSessionState {
  const store = getAuthStore();
  return {
    accessToken: store.accessToken,
    refreshToken: store.refreshToken,
    expiresInSeconds: store.expiresInSeconds,
    username: store.username,
    deviceId: store.deviceId,
    sessionVersion: store.sessionVersion,
  };
}

export function setAuthSession(tokens: TokenBundle, username?: string, deviceId?: string): void {
  const store = getAuthStore();
  store.setSession(tokens, username, deviceId);
}

export function clearAuthSession(): void {
  const store = getAuthStore();
  store.clearSession();
}

export function getDeviceId(): string {
  const store = getAuthStore();
  if (store.deviceId) {
    return store.deviceId;
  }
  return getRememberedDeviceId();
}

export function getRememberedDeviceId(): string {
  const store = getAuthStore();
  if (store.rememberedDeviceId) {
    return store.rememberedDeviceId;
  }
  return (localStorage.getItem(REMEMBERED_DEVICE_ID_STORAGE_KEY) ?? "").trim();
}
