<script setup lang="ts">
import { ref } from "vue";
import LoginPage from "./pages/LoginPage.vue";
import WorkspacePage from "./pages/WorkspacePage.vue";
import ToastStack from "./components/feedback/ToastStack.vue";
import ConfigModal from "./components/modals/ConfigModal.vue";
import { useAuthActions } from "./composables/useAuthActions";
import { useRuntimeConfigModal } from "./composables/useRuntimeConfigModal";

const { isAuthenticated, loginUsername, loginPassword, loginStatus, loginSubmitting, handleLoginSubmit, onLoggedOut } = useAuthActions();

// 登录页也需要配置弹窗（修改后端地址）
const { configOpen, configSubmitting, configApiBaseUrl, configError, currentApiBaseUrl, openConfig, closeConfig, saveConfig, restoreDefaultConfig } = useRuntimeConfigModal(isAuthenticated);

function handleLoggedOut(): void {
  onLoggedOut();
}
</script>

<template>
  <div class="app-root">
    <LoginPage
      v-if="!isAuthenticated"
      :login-username="loginUsername"
      :login-password="loginPassword"
      :login-status="loginStatus"
      :login-submitting="loginSubmitting"
      @update:login-username="loginUsername = $event"
      @update:login-password="loginPassword = $event"
      @submit="handleLoginSubmit"
      @open-config="openConfig"
    />

    <WorkspacePage
      v-else
      :is-authenticated="isAuthenticated"
      @logged-out="handleLoggedOut"
      @open-config="openConfig"
    />

    <ConfigModal
      v-if="configOpen"
      :submitting="configSubmitting"
      :api-base-url="configApiBaseUrl"
      :current-api-base-url="currentApiBaseUrl"
      :error="configError"
      @update:api-base-url="configApiBaseUrl = $event"
      @save="saveConfig"
      @restore-default="restoreDefaultConfig"
      @close="closeConfig"
    />

    <ToastStack />
  </div>
</template>
