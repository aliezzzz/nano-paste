import { defineStore } from "pinia";

export interface TokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

const AUTH_STORAGE_KEY = "nanopaste.desktop.auth";
const REMEMBERED_DEVICE_ID_STORAGE_KEY = "nanopaste.desktop.device_id";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    accessToken: "",
    refreshToken: "",
    expiresInSeconds: 0,
    username: "",
    deviceId: "",
    rememberedDeviceId: "",
    sessionVersion: 0,
  }),
  actions: {
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
