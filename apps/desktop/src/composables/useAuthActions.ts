import { ref, computed } from "vue";
import { loginWithPassword } from "../utils/auth";
import { useAuthStore } from "../stores/auth";
import { useRuntimeStore } from "../stores/runtime";

export function useAuthActions() {
  const authStore = useAuthStore();
  const runtimeStore = useRuntimeStore();

  const isAuthenticated = computed(() => Boolean(authStore.accessToken));
  const username = ref("");
  const loginPassword = ref("");
  const loginStatus = ref("未登录");
  const loginSubmitting = ref(false);

  async function handleLoginSubmit(e: Event): Promise<void> {
    e.preventDefault();
    const normalizedUsername = username.value.trim();
    const password = loginPassword.value;
    if (!normalizedUsername || !password) return;

    try {
      loginSubmitting.value = true;
      loginStatus.value = "登录中...";
      const session = await loginWithPassword({
        baseUrl: runtimeStore.apiBaseUrl,
        username: normalizedUsername,
        password,
      });
      authStore.setSession(session.tokens, session.username);
      loginStatus.value = "登录成功";
    } catch (error) {
      loginStatus.value = `登录失败: ${error instanceof Error ? error.message : "未知错误"}`;
    } finally {
      loginSubmitting.value = false;
    }
  }

  function onLoggedOut(): void {
    loginStatus.value = "未登录";
    loginPassword.value = "";
  }

  return {
    isAuthenticated,
    username,
    loginPassword,
    loginStatus,
    loginSubmitting,
    handleLoginSubmit,
    onLoggedOut,
  };
}
