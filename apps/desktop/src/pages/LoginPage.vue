<script setup lang="ts">
import TrayTemplateIcon from "../assets/icons/tray-template.svg";
import SettingsIcon from "../assets/icons/settings.svg";

const props = defineProps<{
  username: string;
  loginPassword: string;
  loginStatus: string;
  loginSubmitting: boolean;
}>();

const emit = defineEmits<{
  (e: "open-config"): void;
  (e: "update:username", value: string): void;
  (e: "update:loginPassword", value: string): void;
  (e: "submit", event: Event): void;
}>();
</script>

<template>
  <section id="login-page" class="app-login-page">
    <div class="app-login-bg">
      <div class="app-login-bg-radial"></div>
    </div>

    <button
      id="open-config-btn"
      type="button"
      title="连接配置"
      aria-label="连接配置"
      class="app-login-config-btn safe-top-offset"
      @click="emit('open-config')"
    >
      <SettingsIcon class="app-login-config-btn-icon" aria-hidden="true" />
    </button>

    <div class="app-login-shell safe-top safe-bottom">
      <div class="app-login-grid">
        <div class="app-login-grid-spacer"></div>

        <div class="app-login-card-shell">
          <div class="app-login-brand">
            <div class="app-login-brand-icon-wrap">
              <TrayTemplateIcon class="app-login-brand-icon" />
            </div>
            <h1 class="app-login-title">NanoPaste</h1>
            <p class="app-login-subtitle">你的轻量剪贴板工作台</p>
          </div>

          <form id="login-form" class="app-login-form" @submit="emit('submit', $event)">
            <div>
              <label class="app-login-label">用户名</label>
              <input :value="props.username" type="text" id="login-username" placeholder="输入用户名" required autocomplete="username" class="ui-input ui-input-lg" @input="emit('update:username', ($event.target as HTMLInputElement).value)">
            </div>
            <div>
              <label class="app-login-label">密码</label>
              <input :value="props.loginPassword" type="password" id="login-password" placeholder="输入密码" required autocomplete="current-password" class="ui-input ui-input-lg" @input="emit('update:loginPassword', ($event.target as HTMLInputElement).value)">
            </div>
            <p v-if="props.loginStatus && props.loginStatus !== '未登录'" class="app-login-status">{{ props.loginStatus }}</p>
            <button type="submit" id="login-btn" :disabled="props.loginSubmitting" class="app-login-submit-btn">
              登录并进入工作台
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
