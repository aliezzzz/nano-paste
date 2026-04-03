import { DEFAULT_API_BASE_URL, ENV_API_BASE_URL } from "./env";

const RUNTIME_CONFIG_STORAGE_KEY = "nanopaste.runtime.config";

interface RuntimeConfigPayload {
  apiBaseUrl?: string;
}

export interface RuntimeConfig {
  apiBaseUrl: string;
}

let runtimeConfig: RuntimeConfig = {
  apiBaseUrl: resolveInitialApiBaseUrl(),
};

export function getRuntimeConfig(): RuntimeConfig {
  return { ...runtimeConfig };
}

export function getCurrentApiBaseUrl(): string {
  return runtimeConfig.apiBaseUrl;
}

export function setApiBaseUrl(nextApiBaseUrl: string): RuntimeConfig {
  const normalized = normalizeApiBaseUrl(nextApiBaseUrl);
  if (!isValidApiBaseUrl(normalized)) {
    throw new Error("后端地址必须是合法的 http/https URL");
  }

  runtimeConfig = { apiBaseUrl: normalized };
  persistRuntimeConfig(runtimeConfig);
  return getRuntimeConfig();
}

export function resetApiBaseUrl(): RuntimeConfig {
  const fallbackFromEnv = normalizeApiBaseUrl(ENV_API_BASE_URL);
  const fallback = isValidApiBaseUrl(fallbackFromEnv) ? fallbackFromEnv : DEFAULT_API_BASE_URL;
  runtimeConfig = { apiBaseUrl: fallback };
  persistRuntimeConfig(runtimeConfig);
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
  const fromStorage = readStoredApiBaseUrl();
  if (fromStorage) {
    return fromStorage;
  }

  const fromEnv = normalizeApiBaseUrl(ENV_API_BASE_URL);
  if (isValidApiBaseUrl(fromEnv)) {
    return fromEnv;
  }

  return DEFAULT_API_BASE_URL;
}

function readStoredApiBaseUrl(): string {
  const raw = localStorage.getItem(RUNTIME_CONFIG_STORAGE_KEY);
  if (!raw) {
    return "";
  }

  try {
    const parsed = JSON.parse(raw) as RuntimeConfigPayload;
    const normalized = normalizeApiBaseUrl(parsed.apiBaseUrl ?? "");
    if (isValidApiBaseUrl(normalized)) {
      return normalized;
    }
  } catch {
    localStorage.removeItem(RUNTIME_CONFIG_STORAGE_KEY);
  }

  return "";
}

function persistRuntimeConfig(config: RuntimeConfig): void {
  const payload: RuntimeConfigPayload = {
    apiBaseUrl: config.apiBaseUrl,
  };

  localStorage.setItem(RUNTIME_CONFIG_STORAGE_KEY, JSON.stringify(payload));
}

function normalizeApiBaseUrl(input: string): string {
  const normalized = input.trim();
  return normalized.replace(/\/+$/, "");
}
