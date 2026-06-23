<script setup lang="ts">
import { computed } from "vue";
import LoginPage from "./pages/LoginPage.vue";
import WorkspacePage from "./pages/WorkspacePage.vue";
import ToastStack from "./components/feedback/ToastStack.vue";
import { useAuthActions } from "./composables/useAuthActions";
import { useAuthStore } from "./stores/auth";
import { useThemeStore } from "./stores/theme";

const auth = useAuthActions();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const isAuthenticated = computed(() => Boolean(authStore.accessToken));

function updateUsername(value: string): void {
  auth.username.value = value;
}

function updateAuthPassword(value: string): void {
  auth.loginPassword.value = value;
}

</script>

<template>
  <div class="app-root">
    <LoginPage
      v-if="!isAuthenticated"
      :username="auth.username.value"
      :login-password="auth.loginPassword.value"
      :login-status="auth.loginStatus.value"
      :login-submitting="auth.loginSubmitting.value"
      @update:username="updateUsername"
      @update:login-password="updateAuthPassword"
      @submit="auth.handleLoginSubmit"
    />

    <WorkspacePage
      v-else
      :is-authenticated="isAuthenticated"
      @logged-out="auth.onLoggedOut"
    />

    <ToastStack />
  </div>
</template>
