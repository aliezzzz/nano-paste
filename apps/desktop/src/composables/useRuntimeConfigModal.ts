import { ref, computed, type Ref } from "vue";
import { useRuntimeStore } from "../stores/runtime";
import { useBridge } from "./useBridge";
import { showToast } from "../components/feedback/toast";

export function useRuntimeConfigModal(isAuthenticated: Ref<boolean>) {
  const runtimeStore = useRuntimeStore();
  const bridge = useBridge(() => {});

  const configOpen = ref(false);
  const configSubmitting = ref(false);
  const configApiBaseUrl = ref(runtimeStore.apiBaseUrl);
  const configError = ref("");
  const currentApiBaseUrl = computed(() => runtimeStore.apiBaseUrl);

  function isValidApiBaseUrl(input: string): boolean {
    const normalized = input.trim();
    if (!normalized) return false;
    try {
      const parsed = new URL(normalized);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  function openConfig(): void {
    configApiBaseUrl.value = runtimeStore.apiBaseUrl;
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
      runtimeStore.setApiBaseUrl(nextUrl);
      if (isAuthenticated.value) {
        await bridge.applyRuntimeApiBaseUrlChange();
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
      runtimeStore.resetApiBaseUrl();
      configApiBaseUrl.value = runtimeStore.apiBaseUrl;
      if (isAuthenticated.value) {
        await bridge.applyRuntimeApiBaseUrlChange();
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
