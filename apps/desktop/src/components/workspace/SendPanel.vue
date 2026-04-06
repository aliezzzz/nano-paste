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
  <div class="p-4 sm:p-5 border-b border-slate-800/50">
    <h2 class="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
      <svg class="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
      </svg>
      发送文本
    </h2>
    <form id="text-form" class="space-y-3" @submit="handleSubmit">
      <input v-model="title" type="text" id="text-title" placeholder="标题（可选）" maxlength="80" class="ui-input">
      <textarea v-model="content" id="text-content" placeholder="输入要同步的文本..." rows="3" maxlength="500" class="ui-input ui-textarea"></textarea>
      <button type="submit" id="text-submit-btn" class="w-full py-2 px-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70" :disabled="props.submitting">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
        </svg>
        {{ props.submitting ? "发送中..." : "发送" }}
      </button>
    </form>
  </div>
</template>
