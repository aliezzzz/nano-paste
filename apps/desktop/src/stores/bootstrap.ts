import { useAuthStore } from "./auth";
import { useRuntimeStore } from "./runtime";
import {
  isChromeExtensionRuntime,
  readAuthStorage,
} from "../utils/extension-storage";
import { refreshWithToken } from "../utils/auth";
import { syncQuickSendSession } from "../utils/quick-send-session";

export async function bootstrapStoresFromExtensionStorage(): Promise<void> {
  if (!isChromeExtensionRuntime()) {
    const authStore = useAuthStore();
    const runtimeStore = useRuntimeStore();
    await syncQuickSendSession({
      accessToken: authStore.accessToken,
      apiBaseUrl: runtimeStore.apiBaseUrl,
    });
    return;
  }

  const authStore = useAuthStore();
  const runtimeStore = useRuntimeStore();

  const authSnapshot = await readAuthStorage();
  authStore.applyPersistedState(authSnapshot);

  if (authStore.accessToken || !authStore.refreshToken) {
    return;
  }

  try {
    const result = await refreshWithToken(runtimeStore.apiBaseUrl, authStore.refreshToken);
    authStore.setSession(result.tokens, authStore.username || undefined);
  } catch (error) {
    console.warn("扩展存储自动续期失败，需重新登录:", error);
  }
}
