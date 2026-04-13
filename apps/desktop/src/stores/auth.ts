import { defineStore } from "pinia";
import {
  clearAuthStorage,
  isChromeExtensionRuntime,
  type AuthStorageSnapshot,
  writeAuthStorage,
} from "../utils/extension-storage";

export interface TokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

const AUTH_STORAGE_KEY = "nanopaste.desktop.auth";
const isExtensionRuntime = isChromeExtensionRuntime();

export const useAuthStore = defineStore("auth", {
  state: () => ({
    accessToken: "",
    refreshToken: "",
    expiresInSeconds: 0,
    username: "",
    sessionVersion: 0,
  }),
  actions: {
    setSession(tokens: TokenBundle, username?: string): void {
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      this.expiresInSeconds = tokens.expiresInSeconds;
      if (typeof username === "string") {
        this.username = username;
      }
      this.sessionVersion += 1;
      if (isExtensionRuntime) {
        void writeAuthStorage({
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
          expiresInSeconds: this.expiresInSeconds,
          username: this.username,
        });
      }
    },
    applyPersistedState(snapshot: AuthStorageSnapshot): void {
      this.accessToken = snapshot.accessToken;
      this.refreshToken = snapshot.refreshToken;
      this.expiresInSeconds = snapshot.expiresInSeconds;
      this.username = snapshot.username;
      this.sessionVersion += 1;
    },
    clearSession(): void {
      this.accessToken = "";
      this.refreshToken = "";
      this.expiresInSeconds = 0;
      this.username = "";
      this.sessionVersion += 1;
      if (isExtensionRuntime) {
        void clearAuthStorage();
      }
    },
  },
  persist: isExtensionRuntime
    ? false
    : {
      key: AUTH_STORAGE_KEY,
      storage: localStorage,
    },
});
