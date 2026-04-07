import { ref } from "vue";
import { loginWithPassword } from "../utils/auth";
import { getAuthSession, setAuthSession } from "../stores/auth";
import { getCurrentApiBaseUrl } from "../stores/runtime";

export function useAuthActions() {
  const isAuthenticated = ref(Boolean(getAuthSession().accessToken));
  const loginUsername = ref("");
  const loginPassword = ref("");
  const loginStatus = ref("未登录");
  const loginSubmitting = ref(false);

  async function handleLoginSubmit(e: Event): Promise<void> {
    e.preventDefault();
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    if (!username || !password) return;

    try {
      loginSubmitting.value = true;
      loginStatus.value = "登录中...";
      const session = await loginWithPassword({
        baseUrl: getCurrentApiBaseUrl(),
        username,
        password,
      });
      setAuthSession(session.tokens, session.username, session.deviceId);
      loginStatus.value = "登录成功";
      isAuthenticated.value = true;
    } catch (error) {
      loginStatus.value = `登录失败: ${error instanceof Error ? error.message : "未知错误"}`;
    } finally {
      loginSubmitting.value = false;
    }
  }

  function onLoggedOut(): void {
    isAuthenticated.value = false;
    loginStatus.value = "未登录";
    loginPassword.value = "";
  }

  return {
    isAuthenticated,
    loginUsername,
    loginPassword,
    loginStatus,
    loginSubmitting,
    handleLoginSubmit,
    onLoggedOut,
  };
}
