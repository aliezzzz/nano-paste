import { defineStore } from "pinia";
import { DEFAULT_API_BASE_URL } from "../constants/extension-storage";
import { isChromeExtensionRuntime, writeRuntimeApiBaseUrl } from "../utils/extension-storage";

const RUNTIME_CONFIG_STORAGE_KEY = "nanopaste.runtime.config";
const ENV_DEFAULT_API_BASE_URL = (import.meta.env.VITE_DEFAULT_APP_API_BASE_URL ?? "").trim();
const isExtensionRuntime = isChromeExtensionRuntime();

function normalizeApiBaseUrl(input: string): string {
  const normalized = input.trim();
  return normalized.replace(/\/+$/, "");
}

function isValidApiBaseUrl(input: string): boolean {
  const normalized = normalizeApiBaseUrl(input);
  if (!normalized) return false;
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveInitialApiBaseUrl(): string {
  const fromEnv = normalizeApiBaseUrl(ENV_DEFAULT_API_BASE_URL);
  if (isValidApiBaseUrl(fromEnv)) {
    return fromEnv;
  }
  return DEFAULT_API_BASE_URL;
}

export const useRuntimeStore = defineStore("runtime-config", {
  state: () => ({
    apiBaseUrl: resolveInitialApiBaseUrl(),
  }),
  actions: {
    setApiBaseUrl(nextApiBaseUrl: string): void {
      const normalized = normalizeApiBaseUrl(nextApiBaseUrl);
      if (!isValidApiBaseUrl(normalized)) {
        throw new Error("后端地址必须是合法的 http/https URL");
      }
      this.apiBaseUrl = normalized;
      if (isExtensionRuntime) {
        void writeRuntimeApiBaseUrl(this.apiBaseUrl);
      }
    },
    applyPersistedState(snapshot: { apiBaseUrl?: string }): void {
      const maybeApiBaseUrl = normalizeApiBaseUrl(snapshot.apiBaseUrl ?? "");
      if (isValidApiBaseUrl(maybeApiBaseUrl)) {
        this.apiBaseUrl = maybeApiBaseUrl;
      }
    },
    resetApiBaseUrl(): void {
      const fallbackFromEnv = normalizeApiBaseUrl(ENV_DEFAULT_API_BASE_URL);
      const fallback = isValidApiBaseUrl(fallbackFromEnv) ? fallbackFromEnv : DEFAULT_API_BASE_URL;
      this.apiBaseUrl = fallback;
      if (isExtensionRuntime) {
        void writeRuntimeApiBaseUrl(this.apiBaseUrl);
      }
    },
  },
  persist: isExtensionRuntime
    ? false
    : {
      key: RUNTIME_CONFIG_STORAGE_KEY,
      storage: localStorage,
    },
});

export function resolveApiUrl(pathOrUrl: string): string {
  const value = (pathOrUrl ?? "").trim();
  if (!value) {
    return "";
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // ignore and treat as relative path
  }

  const runtimeStore = useRuntimeStore();
  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${runtimeStore.apiBaseUrl}${normalizedPath}`;
}
