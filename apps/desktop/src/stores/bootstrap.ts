import { useAuthStore } from "./auth";
import {
  isChromeExtensionRuntime,
  readAuthStorage,
} from "../utils/extension-storage";

export async function bootstrapStoresFromExtensionStorage(): Promise<void> {
  if (!isChromeExtensionRuntime()) {
    return;
  }

  const authStore = useAuthStore();

  const authSnapshot = await readAuthStorage();
  authStore.applyPersistedState(authSnapshot);
}
