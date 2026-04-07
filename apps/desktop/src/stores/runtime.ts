import { defineStore } from "pinia";
import { pinia } from ".";

const RUNTIME_CONFIG_STORAGE_KEY = "nanopaste.runtime.config";
const DEFAULT_API_BASE_URL = "http://localhost:8080";
const ENV_DEFAULT_API_BASE_URL = (import.meta.env.VITE_DEFAULT_APP_API_BASE_URL ?? "").trim();

export interface RuntimeConfig {
  apiBaseUrl: string;
}

const useRuntimeConfigStore = defineStore("runtime-config", {
  state: (): RuntimeConfig => ({
    apiBaseUrl: resolveInitialApiBaseUrl(),
  }),
  actions: {
    setApiBaseUrl(nextApiBaseUrl: string): void {
      const normalized = normalizeApiBaseUrl(nextApiBaseUrl);
      if (!isValidApiBaseUrl(normalized)) {
        throw new Error("后端地址必须是合法的 http/https URL");
      }
      this.apiBaseUrl = normalized;
    },
    resetApiBaseUrl(): void {
      const fallbackFromEnv = normalizeApiBaseUrl(ENV_DEFAULT_API_BASE_URL);
      const fallback = isValidApiBaseUrl(fallbackFromEnv) ? fallbackFromEnv : DEFAULT_API_BASE_URL;
      this.apiBaseUrl = fallback;
    },
  },
  persist: {
    key: RUNTIME_CONFIG_STORAGE_KEY,
    storage: localStorage,
  },
});

function getRuntimeStore(): ReturnType<typeof useRuntimeConfigStore> {
  return useRuntimeConfigStore(pinia);
}

export function useRuntimeStore() {
  return useRuntimeConfigStore();
}

export function getRuntimeConfig(): RuntimeConfig {
  const runtimeStore = getRuntimeStore();
  return { apiBaseUrl: runtimeStore.apiBaseUrl };
}

export function getCurrentApiBaseUrl(): string {
  return getRuntimeStore().apiBaseUrl;
}

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

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${getCurrentApiBaseUrl()}${normalizedPath}`;
}

export function setApiBaseUrl(nextApiBaseUrl: string): RuntimeConfig {
  const runtimeStore = getRuntimeStore();
  runtimeStore.setApiBaseUrl(nextApiBaseUrl);
  return getRuntimeConfig();
}

export function resetApiBaseUrl(): RuntimeConfig {
  const runtimeStore = getRuntimeStore();
  runtimeStore.resetApiBaseUrl();
  return getRuntimeConfig();
}

export function isValidApiBaseUrl(input: string): boolean {
  const normalized = normalizeApiBaseUrl(input);
  if (!normalized) {
    return false;
  }

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

function normalizeApiBaseUrl(input: string): string {
  const normalized = input.trim();
  return normalized.replace(/\/+$/, "");
}
