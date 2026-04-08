<script setup lang="ts">
import { ref } from "vue";
import editIcon from "../../assets/icons/edit.svg?url";
import sendIcon from "../../assets/icons/send.svg?url";

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
      <img :src="editIcon" class="send-panel-title-icon" alt="">
      发送文本
    </h2>
    <form id="text-form" class="send-panel-form" @submit="handleSubmit">
      <input v-model="title" type="text" id="text-title" placeholder="标题（可选）" maxlength="80" class="ui-input">
      <textarea v-model="content" id="text-content" placeholder="输入要同步的文本..." rows="3" maxlength="500" class="ui-input ui-textarea"></textarea>
      <button type="submit" id="text-submit-btn" class="send-panel-submit" :disabled="props.submitting">
        <img :src="sendIcon" class="send-panel-submit-icon" alt="">
        {{ props.submitting ? "发送中..." : "发送" }}
      </button>
    </form>
  </div>
</template>
