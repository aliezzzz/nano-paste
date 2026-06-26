<script setup lang="ts">
import { computed } from "vue";
import TrayTemplateIcon from "../assets/icons/tray-template.svg";
import { isChromeExtensionRuntime } from "../utils/extension-storage";

const props = defineProps<{
  username: string;
  loginPassword: string;
  loginStatus: string;
  loginSubmitting: boolean;
}>();

const emit = defineEmits<{
  (e: "update:username", value: string): void;
  (e: "update:loginPassword", value: string): void;
  (e: "submit", event: Event): void;
}>();

const isExtension = computed(() => isChromeExtensionRuntime());
</script>

<template>
  <section id="login-page" class="app-login-page" :class="{ 'app-login-page--ext': isExtension }">
    <div class="app-login-bg">
      <div class="app-login-bg-radial"></div>
    </div>

    <div class="app-login-container safe-top safe-bottom">
      <div class="app-login-grid">
        <!-- 桌面端左侧品牌区 -->
        <div class="app-login-hero">
          <div class="app-login-hero-icon-wrap">
            <TrayTemplateIcon class="app-login-hero-icon" />
          </div>
          <h1 class="app-login-hero-title">NanoPaste</h1>
          <p class="app-login-hero-subtitle">轻量剪贴板工作台</p>
          <p class="app-login-hero-desc">跨设备同步文本、图片和文件</p>
          <div class="app-login-hero-points" aria-label="核心能力">
            <span class="app-login-hero-point">文本</span>
            <span class="app-login-hero-point">图片</span>
            <span class="app-login-hero-point">文件</span>
          </div>
        </div>

        <!-- 登录卡片 -->
        <div class="app-login-card">
          <!-- 移动端 / 插件端内联品牌 -->
          <div class="app-login-card-brand">
            <div class="app-login-card-brand-icon-wrap">
              <TrayTemplateIcon class="app-login-card-brand-icon" />
            </div>
            <div class="app-login-card-brand-copy">
              <span class="app-login-card-brand-text">NanoPaste</span>
              <p class="app-login-card-brand-subtitle">{{ isExtension ? '浏览器快速入口' : '轻量剪贴板工作台' }}</p>
            </div>
          </div>

          <div class="app-login-note">
            <span class="app-login-note-dot" aria-hidden="true"></span>
            <span>{{ isExtension ? '连接到你的剪贴板工作台' : '登录后同步文本、图片和文件' }}</span>
          </div>

          <form id="login-form" class="app-login-form" @submit="emit('submit', $event)">
            <div>
              <label class="app-login-label">用户名</label>
              <input
                :value="props.username"
                type="text"
                id="login-username"
                placeholder="输入用户名"
                required
                autocomplete="username"
                class="ui-input"
                @input="emit('update:username', ($event.target as HTMLInputElement).value)"
              >
            </div>
            <div>
              <label class="app-login-label">密码</label>
              <input
                :value="props.loginPassword"
                type="password"
                id="login-password"
                placeholder="输入密码"
                required
                autocomplete="current-password"
                class="ui-input"
                @input="emit('update:loginPassword', ($event.target as HTMLInputElement).value)"
              >
            </div>
            <p v-if="props.loginStatus && props.loginStatus !== '未登录'" class="app-login-status">{{ props.loginStatus }}</p>
            <button type="submit" id="login-btn" :disabled="props.loginSubmitting" class="app-login-submit-btn">
              {{ props.loginSubmitting ? '登录中...' : '登录' }}
            </button>
          </form>

          <p class="app-login-footnote">文本、图片、文件，随手同步</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 扩展插件弹窗紧凑布局 */
.app-login-page--ext {
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.app-login-page--ext .app-login-container {
  min-height: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px 24px;
}

.app-login-page--ext .app-login-grid {
  display: block;
  max-width: 390px;
  width: 100%;
}

.app-login-page--ext .app-login-card {
  padding: 22px 24px;
  border-radius: 18px;
}

.app-login-page--ext .app-login-card-brand {
  margin-bottom: 14px;
}

.app-login-page--ext .app-login-card-brand-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 10px;
}

.app-login-page--ext .app-login-card-brand-icon {
  width: 18px;
  height: 18px;
}

.app-login-page--ext .app-login-card-brand-text {
  font-size: 16px;
}

.app-login-page--ext .app-login-card-brand-subtitle {
  font-size: 11px;
}

.app-login-page--ext .app-login-note {
  margin-bottom: 14px;
  padding: 9px 10px;
  font-size: 11px;
}

.app-login-page--ext .app-login-form > * + * {
  margin-top: 12px;
}

.app-login-page--ext .app-login-label {
  font-size: 12px;
  margin-bottom: 4px;
}

.app-login-page--ext .app-login-submit-btn {
  height: 42px;
  font-size: 13px;
  border-radius: 10px;
}

.app-login-page--ext .app-login-footnote {
  margin-top: 14px;
  font-size: 11px;
}
</style>
