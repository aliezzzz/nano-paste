import { ref, computed } from "vue";
import { getCurrentApiBaseUrl, isValidApiBaseUrl, resetApiBaseUrl, setApiBaseUrl } from "../stores/runtime";
import { applyRuntimeApiBaseUrlChange } from "../bridge";
import { showToast } from "../components/feedback/toast";

export function useRuntimeConfigModal(isAuthenticated: { value: boolean }) {
  const configOpen = ref(false);
  const configSubmitting = ref(false);
  const configApiBaseUrl = ref(getCurrentApiBaseUrl());
  const configError = ref("");
  const currentApiBaseUrl = computed(() => getCurrentApiBaseUrl());

  function openConfig(): void {
    configApiBaseUrl.value = getCurrentApiBaseUrl();
    configError.value = "";
    configOpen.value = true;
  }

  function closeConfig(): void {
    configOpen.value = false;
    configError.value = "";
  }

  async function saveConfig(): Promise<void> {
    const nextUrl = configApiBaseUrl.value.trim();
    if (!isValidApiBaseUrl(nextUrl)) {
      configError.value = "请输入合法的 http/https 地址，例如 http://127.0.0.1:8080";
      return;
    }
    try {
      configSubmitting.value = true;
      configError.value = "";
      setApiBaseUrl(nextUrl);
      if (isAuthenticated.value) {
        await applyRuntimeApiBaseUrlChange();
      }
      showToast("后端地址已更新并生效", "success");
      closeConfig();
    } catch (error) {
      const message = error instanceof Error ? error.message : "配置应用失败";
      configError.value = message;
      showToast(`配置应用失败: ${message}`, "error");
    } finally {
      configSubmitting.value = false;
    }
  }

  async function restoreDefaultConfig(): Promise<void> {
    try {
      configSubmitting.value = true;
      configError.value = "";
      resetApiBaseUrl();
      configApiBaseUrl.value = getCurrentApiBaseUrl();
      if (isAuthenticated.value) {
        await applyRuntimeApiBaseUrlChange();
      }
      showToast("已恢复默认地址并生效", "success");
      closeConfig();
    } catch (error) {
      const message = error instanceof Error ? error.message : "恢复默认失败";
      configError.value = message;
      showToast(`恢复默认失败: ${message}`, "error");
    } finally {
      configSubmitting.value = false;
    }
  }

  return {
    configOpen,
    configSubmitting,
    configApiBaseUrl,
    configError,
    currentApiBaseUrl,
    openConfig,
    closeConfig,
    saveConfig,
    restoreDefaultConfig,
  };
}
