import { invoke } from "@tauri-apps/api/core";
import { isChromeExtensionRuntime } from "./extension-storage";

export async function syncQuickSendSession(input: { accessToken: string; apiBaseUrl: string }): Promise<void> {
  if (isChromeExtensionRuntime() || !input.accessToken || !input.apiBaseUrl) return;

  try {
    await invoke("sync_quick_send_session", {
      payload: {
        accessToken: input.accessToken,
        apiBaseUrl: input.apiBaseUrl,
      },
    });
  } catch (error) {
    console.error("同步快速发送会话失败:", error);
  }
}

export async function clearQuickSendSession(): Promise<void> {
  if (isChromeExtensionRuntime()) return;

  try {
    await invoke("clear_quick_send_session");
  } catch (error) {
    console.error("清除快速发送会话失败:", error);
  }
}
