<script setup lang="ts">
const props = defineProps<{
  submitting: boolean;
  apiBaseUrl: string;
  currentApiBaseUrl: string;
  error: string;
}>();

const emit = defineEmits<{
  (e: "update:apiBaseUrl", value: string): void;
  (e: "save"): void;
  (e: "restore-default"): void;
  (e: "close"): void;
}>();
</script>

<template>
  <div class="app-modal-wrap app-modal-wrap--config">
    <div class="app-modal-backdrop" @click="emit('close')"></div>
    <div class="app-modal-center">
      <div class="app-modal-card app-modal-card--config">
        <div class="app-modal-header">
          <div>
            <h3 class="app-modal-title">连接配置</h3>
            <p class="app-modal-subtitle">修改后端地址后将立即重连</p>
          </div>
          <button type="button" class="app-modal-close-btn" @click="emit('close')">✕</button>
        </div>

        <form class="app-config-form" @submit.prevent="emit('save')">
          <div>
            <label for="runtime-config-api-base-url" class="app-config-label">后端地址</label>
            <input
              id="runtime-config-api-base-url"
              :value="props.apiBaseUrl"
              type="url"
              spellcheck="false"
              placeholder="http://127.0.0.1:8080"
              class="ui-input"
              @input="emit('update:apiBaseUrl', ($event.target as HTMLInputElement).value)"
            />
            <p v-if="props.error" class="app-config-error">{{ props.error }}</p>
            <p class="app-config-current">当前生效：<span class="app-config-current-value">{{ props.currentApiBaseUrl }}</span></p>
          </div>

          <div class="app-config-actions">
            <button type="button" class="app-config-btn app-config-btn--neutral" :disabled="props.submitting" @click="emit('restore-default')">恢复默认</button>
            <button type="button" class="app-config-btn app-config-btn--neutral" :disabled="props.submitting" @click="emit('close')">取消</button>
            <button type="submit" class="app-config-btn app-config-btn--primary" :disabled="props.submitting">保存并应用</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
