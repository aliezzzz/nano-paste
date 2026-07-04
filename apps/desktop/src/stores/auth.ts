import { defineStore } from "pinia";
import {
  clearAuthStorage,
  isChromeExtensionRuntime,
  type AuthStorageSnapshot,
  writeAuthStorage,
} from "../utils/extension-storage";
import { clearQuickSendSession, syncQuickSendSession } from "../utils/quick-send-session";
import { useRuntimeStore } from "./runtime";

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
      const runtimeStore = useRuntimeStore();
      void syncQuickSendSession({
        accessToken: this.accessToken,
        apiBaseUrl: runtimeStore.apiBaseUrl,
      });
    },
    applyPersistedState(snapshot: AuthStorageSnapshot): void {
      this.accessToken = snapshot.accessToken;
      this.refreshToken = snapshot.refreshToken;
      this.expiresInSeconds = snapshot.expiresInSeconds;
      this.username = snapshot.username;
      this.sessionVersion += 1;
      const runtimeStore = useRuntimeStore();
      void syncQuickSendSession({
        accessToken: this.accessToken,
        apiBaseUrl: runtimeStore.apiBaseUrl,
      });
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
      void clearQuickSendSession();
    },
  },
  persist: isExtensionRuntime
    ? false
    : {
      key: AUTH_STORAGE_KEY,
      storage: localStorage,
    },
});
