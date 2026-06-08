<script setup lang="ts">
import { ref } from "vue";
import EditIcon from "../../assets/icons/edit.svg";
import SendIcon from "../../assets/icons/send.svg";

const props = withDefaults(defineProps<{ submitting?: boolean }>(), {
  submitting: false,
});

const emit = defineEmits<{
  (e: "submit", payload: { title?: string; content: string; tags?: string[] }): void;
}>();

const title = ref("");
const content = ref("");
const tagsInput = ref("");

function handleSubmit(e: Event): void {
  e.preventDefault();
  const payload = {
    title: title.value.trim() || undefined,
    content: content.value,
    tags: normalizeTagsInput(tagsInput.value),
  };
  if (!payload.content.trim()) {
    return;
  }
  emit("submit", payload);
}

function normalizeTagsInput(value: string): string[] | undefined {
  const tags = value.split(/[\s,，]+/).map((tag) => tag.trim()).filter(Boolean);
  const unique = Array.from(new Set(tags));
  return unique.length > 0 ? unique : undefined;
}

function clear(): void {
  title.value = "";
  content.value = "";
  tagsInput.value = "";
}

defineExpose({ clear });
</script>

<template>
  <div class="send-panel">
    <h2 class="send-panel-title">
      <EditIcon class="send-panel-title-icon" />
      发送文本
    </h2>
    <form id="text-form" class="send-panel-form" @submit="handleSubmit">
      <input v-model="title" type="text" id="text-title" placeholder="标题（可选）" maxlength="80" class="ui-input">
      <input v-model="tagsInput" data-testid="text-tags" type="text" placeholder="标签，用空格或逗号分隔（可选）" maxlength="120" class="ui-input">
      <textarea v-model="content" id="text-content" placeholder="输入要同步的文本..." rows="3" maxlength="500" class="ui-input ui-textarea"></textarea>
      <button type="submit" id="text-submit-btn" class="send-panel-submit" :disabled="props.submitting">
        <SendIcon class="send-panel-submit-icon" />
        {{ props.submitting ? "发送中..." : "发送" }}
      </button>
    </form>
  </div>
</template>
