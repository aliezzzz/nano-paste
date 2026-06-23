import { defineStore } from "pinia";
import { DEFAULT_API_BASE_URL } from "../constants/extension-storage";

const ENV_DEFAULT_API_BASE_URL = (import.meta.env.VITE_DEFAULT_APP_API_BASE_URL ?? "").trim();

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
