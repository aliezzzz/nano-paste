import { useAuthStore } from "./auth";
import { useRuntimeStore } from "./runtime";
import {
  isChromeExtensionRuntime,
  readAuthStorage,
  readRuntimeApiBaseUrl,
} from "../utils/extension-storage";

export async function bootstrapStoresFromExtensionStorage(): Promise<void> {
  if (!isChromeExtensionRuntime()) {
    return;
  }

  const authStore = useAuthStore();
  const runtimeStore = useRuntimeStore();

  const [authSnapshot, runtimeApiBaseUrl] = await Promise.all([
    readAuthStorage(),
    readRuntimeApiBaseUrl(),
  ]);

  authStore.applyPersistedState(authSnapshot);
  runtimeStore.applyPersistedState({ apiBaseUrl: runtimeApiBaseUrl });
}
