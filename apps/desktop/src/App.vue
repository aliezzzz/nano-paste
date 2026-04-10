<script setup lang="ts">
import { computed } from "vue";
import LoginPage from "./pages/LoginPage.vue";
import WorkspacePage from "./pages/WorkspacePage.vue";
import ToastStack from "./components/feedback/ToastStack.vue";
import ConfigModal from "./components/modals/ConfigModal.vue";
import { useAuthActions } from "./composables/useAuthActions";
import { useRuntimeConfigModal } from "./composables/useRuntimeConfigModal";
import { useAuthStore } from "./stores/auth";

const auth = useAuthActions();
const authStore = useAuthStore();
const config = useRuntimeConfigModal(computed(() => Boolean(authStore.accessToken)));

const isAuthenticated = computed(() => Boolean(authStore.accessToken));

function updateUsername(value: string): void {
  auth.username.value = value;
}

function updateAuthPassword(value: string): void {
  auth.loginPassword.value = value;
}

function updateConfigApiUrl(value: string): void {
  config.configApiBaseUrl.value = value;
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
      @open-config="config.openConfig"
    />

    <WorkspacePage
      v-else
      :is-authenticated="isAuthenticated"
      @logged-out="auth.onLoggedOut"
      @open-config="config.openConfig"
    />

    <ConfigModal
      v-if="config.configOpen.value"
      :submitting="config.configSubmitting.value"
      :api-base-url="config.configApiBaseUrl.value"
      :current-api-base-url="config.currentApiBaseUrl.value"
      :error="config.configError.value"
      @update:api-base-url="updateConfigApiUrl"
      @save="config.saveConfig"
      @restore-default="config.restoreDefaultConfig"
      @close="config.closeConfig"
    />

    <ToastStack />
  </div>
</template>
