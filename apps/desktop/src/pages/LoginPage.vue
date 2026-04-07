<script setup lang="ts">
import trayTemplateIcon from "../assets/icons/tray-template.svg?url";

const props = defineProps<{
  loginUsername: string;
  loginPassword: string;
  loginStatus: string;
  loginSubmitting: boolean;
}>();

const emit = defineEmits<{
  (e: "open-config"): void;
  (e: "update:loginUsername", value: string): void;
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
      <svg viewBox="0 0 1024 1024" class="app-login-config-btn-icon" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M512 426.666667c-46.933333 0-85.333333 38.4-85.333333 85.333333s38.4 85.333333 85.333333 85.333333 85.333333-38.4 85.333333-85.333333-38.4-85.333333-85.333333-85.333333z m298.666667-298.666667H213.333333a85.333333 85.333333 0 0 0-85.333333 85.333333v597.333334a85.333333 85.333333 0 0 0 85.333333 85.333333h597.333334a85.333333 85.333333 0 0 0 85.333333-85.333333V213.333333a85.333333 85.333333 0 0 0-85.333333-85.333333z m-74.666667 384c0 9.813333-0.853333 19.626667-2.133333 29.013333l63.146666 49.493334c5.546667 4.693333 7.253333 12.8 3.413334 19.2l-59.733334 103.253333c-3.84 6.4-11.52 8.96-18.346666 6.4l-74.24-29.866667c-15.36 11.946667-32.426667 21.76-50.346667 29.44l-11.093333 78.933334c-1.28 7.253333-7.68 12.8-14.933334 12.8h-119.466666c-7.253333 0-13.653333-5.546667-14.933334-12.373334l-11.093333-78.933333c-18.346667-7.68-34.986667-17.493333-50.346667-29.44l-74.24 29.866667c-6.826667 2.56-14.506667 0-18.346666-6.4l-59.733334-103.253334a15.061333 15.061333 0 0 1 3.413334-19.2l63.146666-49.493333c-1.28-9.813333-2.133333-19.626667-2.133333-29.44 0-9.813333 0.853333-19.626667 2.133333-29.013333l-63.146666-49.493334a15.061333 15.061333 0 0 1-3.413334-19.2l59.733334-103.253333c3.84-6.4 11.52-8.96 18.346666-6.4l74.24 29.866667c15.36-11.946667 32.426667-21.76 50.346667-29.44l11.093333-78.933334c1.28-7.253333 7.68-12.8 14.933334-12.8h119.466666c7.253333 0 13.653333 5.546667 14.933334 12.373334l11.093333 78.933333c18.346667 7.68 34.986667 17.493333 50.346667 29.44l74.24-29.866667c6.826667-2.56 14.506667 0 18.346666 6.4l59.733334 103.253334c3.84 6.4 2.133333 14.506667-3.413334 19.2l-63.146666 49.493333c1.28 9.813333 2.133333 19.626667 2.133333 29.44z" fill="currentColor"></path>
      </svg>
    </button>

    <div class="app-login-shell safe-top safe-bottom">
      <div class="app-login-grid">
        <div class="app-login-grid-spacer"></div>

        <div class="app-login-card-shell">
          <div class="app-login-brand">
            <div class="app-login-brand-icon-wrap">
              <img class="app-login-brand-icon" :src="trayTemplateIcon" alt="NanoPaste logo">
            </div>
            <h1 class="app-login-title">NanoPaste</h1>
            <p class="app-login-subtitle">跨设备同步，即刻开始</p>
          </div>

          <form id="login-form" class="app-login-form" @submit="emit('submit', $event)">
            <div>
              <label class="app-login-label">用户名</label>
              <input :value="props.loginUsername" type="text" id="login-username" placeholder="输入用户名" required autocomplete="username" class="ui-input ui-input-lg" @input="emit('update:loginUsername', ($event.target as HTMLInputElement).value)">
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
