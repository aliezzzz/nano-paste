import { DEFAULT_API_BASE_URL, EXT_STORAGE_KEYS } from "../constants/extension-storage";

type ExtensionStorageArea = "local" | "sync" | "session";

export interface AuthStorageSnapshot {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  username: string;
}

export function isChromeExtensionRuntime(): boolean {
  return typeof chrome !== "undefined"
    && typeof chrome.runtime?.id === "string"
    && typeof chrome.storage !== "undefined";
}

export async function readAuthStorage(): Promise<AuthStorageSnapshot> {
  if (!isChromeExtensionRuntime()) {
    return {
      accessToken: "",
      refreshToken: "",
      expiresInSeconds: 0,
      username: "",
    };
  }

  const [sessionData, localData] = await Promise.all([
    getChromeStorageValues("session", [EXT_STORAGE_KEYS.authAccessToken]),
    getChromeStorageValues("local", [
      EXT_STORAGE_KEYS.authRefreshToken,
      EXT_STORAGE_KEYS.authExpiresInSeconds,
      EXT_STORAGE_KEYS.authUsername,
    ]),
  ]);

  return {
    accessToken: readStringValue(sessionData[EXT_STORAGE_KEYS.authAccessToken]),
    refreshToken: readStringValue(localData[EXT_STORAGE_KEYS.authRefreshToken]),
    expiresInSeconds: readNumberValue(localData[EXT_STORAGE_KEYS.authExpiresInSeconds]),
    username: readStringValue(localData[EXT_STORAGE_KEYS.authUsername]),
  };
}

export async function writeAuthStorage(snapshot: AuthStorageSnapshot): Promise<void> {
  if (!isChromeExtensionRuntime()) {
    return;
  }

  const accessToken = snapshot.accessToken.trim();
  const refreshToken = snapshot.refreshToken.trim();
  const username = snapshot.username.trim();
  const expiresInSeconds = Number.isFinite(snapshot.expiresInSeconds) ? snapshot.expiresInSeconds : 0;

  if (!accessToken && !refreshToken) {
    await clearAuthStorage();
    return;
  }

  await Promise.all([
    setChromeStorageValues("session", {
      [EXT_STORAGE_KEYS.authAccessToken]: accessToken,
    }),
    setChromeStorageValues("local", {
      [EXT_STORAGE_KEYS.authRefreshToken]: refreshToken,
      [EXT_STORAGE_KEYS.authExpiresInSeconds]: expiresInSeconds,
      [EXT_STORAGE_KEYS.authUsername]: username,
    }),
  ]);
}

export async function clearAuthStorage(): Promise<void> {
  if (!isChromeExtensionRuntime()) {
    return;
  }

  await Promise.all([
    removeChromeStorageValues("session", [EXT_STORAGE_KEYS.authAccessToken]),
    removeChromeStorageValues("local", [
      EXT_STORAGE_KEYS.authRefreshToken,
      EXT_STORAGE_KEYS.authExpiresInSeconds,
      EXT_STORAGE_KEYS.authUsername,
    ]),
  ]);
}

export async function readRuntimeApiBaseUrl(): Promise<string> {
  if (!isChromeExtensionRuntime()) {
    return DEFAULT_API_BASE_URL;
  }

  const data = await getChromeStorageValues("sync", [EXT_STORAGE_KEYS.runtimeApiBaseUrl]);
  const fromStorage = readStringValue(data[EXT_STORAGE_KEYS.runtimeApiBaseUrl]);
  return fromStorage || DEFAULT_API_BASE_URL;
}

export async function writeRuntimeApiBaseUrl(value: string): Promise<void> {
  if (!isChromeExtensionRuntime()) {
    return;
  }

  const normalized = value.trim().replace(/\/+$/, "");
  if (!normalized) {
    await removeChromeStorageValues("sync", [EXT_STORAGE_KEYS.runtimeApiBaseUrl]);
    return;
  }

  await setChromeStorageValues("sync", {
    [EXT_STORAGE_KEYS.runtimeApiBaseUrl]: normalized,
  });
}

function getChromeStorageArea(area: ExtensionStorageArea): chrome.storage.StorageArea | null {
  if (!isChromeExtensionRuntime()) {
    return null;
  }
  if (area === "session") {
    return chrome.storage.session;
  }
  if (area === "sync") {
    return chrome.storage.sync;
  }
  return chrome.storage.local;
}

function getChromeStorageValues(
  area: ExtensionStorageArea,
  keys: string[],
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const storageArea = getChromeStorageArea(area);
    if (!storageArea) {
      resolve({});
      return;
    }

    storageArea.get(keys, (result) => {
      if (chrome.runtime?.lastError) {
        reject(new Error(chrome.runtime.lastError.message || "读取扩展存储失败"));
        return;
      }
      resolve(result ?? {});
    });
  });
}

function setChromeStorageValues(area: ExtensionStorageArea, values: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const storageArea = getChromeStorageArea(area);
    if (!storageArea) {
      resolve();
      return;
    }

    storageArea.set(values, () => {
      if (chrome.runtime?.lastError) {
        reject(new Error(chrome.runtime.lastError.message || "写入扩展存储失败"));
        return;
      }
      resolve();
    });
  });
}

function removeChromeStorageValues(area: ExtensionStorageArea, keys: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const storageArea = getChromeStorageArea(area);
    if (!storageArea) {
      resolve();
      return;
    }

    storageArea.remove(keys, () => {
      if (chrome.runtime?.lastError) {
        reject(new Error(chrome.runtime.lastError.message || "删除扩展存储失败"));
        return;
      }
      resolve();
    });
  });
}

function readStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readNumberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
