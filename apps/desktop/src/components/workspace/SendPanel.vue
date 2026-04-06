<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(defineProps<{ submitting?: boolean }>(), {
  submitting: false,
});

const emit = defineEmits<{
  (e: "submit", payload: { title?: string; content: string }): void;
}>();

const title = ref("");
const content = ref("");

function handleSubmit(e: Event): void {
  e.preventDefault();
  const payload = {
    title: title.value.trim() || undefined,
    content: content.value,
  };
  if (!payload.content.trim()) {
    return;
  }
  emit("submit", payload);
}

function clear(): void {
  title.value = "";
  content.value = "";
}

defineExpose({ clear });
</script>

<template>
  <div class="send-panel">
    <h2 class="send-panel-title">
      <svg class="send-panel-title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
      </svg>
      发送文本
    </h2>
    <form id="text-form" class="send-panel-form" @submit="handleSubmit">
      <input v-model="title" type="text" id="text-title" placeholder="标题（可选）" maxlength="80" class="ui-input">
      <textarea v-model="content" id="text-content" placeholder="输入要同步的文本..." rows="3" maxlength="500" class="ui-input ui-textarea"></textarea>
      <button type="submit" id="text-submit-btn" class="send-panel-submit" :disabled="props.submitting">
        <svg class="send-panel-submit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
        </svg>
        {{ props.submitting ? "发送中..." : "发送" }}
      </button>
    </form>
  </div>
</template>
