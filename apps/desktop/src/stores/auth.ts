import { defineStore } from "pinia";

export interface TokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

const AUTH_STORAGE_KEY = "nanopaste.desktop.auth";

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
    },
    clearSession(): void {
      this.accessToken = "";
      this.refreshToken = "";
      this.expiresInSeconds = 0;
      this.username = "";
      this.sessionVersion += 1;
    },
  },
  persist: {
    key: AUTH_STORAGE_KEY,
    storage: localStorage,
  },
});
