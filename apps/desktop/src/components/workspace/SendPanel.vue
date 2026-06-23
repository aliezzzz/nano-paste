<script setup lang="ts">
import { computed, ref, watch } from "vue";
import EditIcon from "../../assets/icons/edit.svg";
import SendIcon from "../../assets/icons/send.svg";

const props = withDefaults(defineProps<{ submitting?: boolean; topicSuggestions?: string[]; clearVersion?: number }>(), {
  submitting: false,
  topicSuggestions: () => [],
  clearVersion: 0,
});

const emit = defineEmits<{
  (e: "submit", payload: { title?: string; content: string; tags?: string[]; topic?: string; contentKind?: "text" | "code"; language?: string }): void;
}>();

const title = ref("");
const content = ref("");
const selectedTopic = ref("");
const customTopic = ref("");
const contentKind = ref<"text" | "code">("text");
const language = ref("");

const hasExistingTopics = computed(() => props.topicSuggestions.length > 0);
const topicValue = computed(() => customTopic.value.trim() || selectedTopic.value.trim());

function handleSubmit(e: Event): void {
  e.preventDefault();
  const payload = {
    title: title.value.trim() || undefined,
    content: content.value,
    topic: topicValue.value || undefined,
    contentKind: contentKind.value,
    language: contentKind.value === "code" ? language.value || undefined : undefined,
  };
  if (!payload.content.trim()) {
    return;
  }
  emit("submit", payload);
}

function handleCustomTopicInput(): void {
  if (customTopic.value.trim()) {
    selectedTopic.value = "";
  }
}

function clear(): void {
  title.value = "";
  content.value = "";
  selectedTopic.value = "";
  customTopic.value = "";
  contentKind.value = "text";
  language.value = "";
}

watch(
  () => props.clearVersion,
  (version, previousVersion) => {
    if (version > 0 && version !== previousVersion) {
      clear();
    }
  },
);

defineExpose({ clear });
</script>

<template>
  <div class="send-panel">
    <div class="send-panel-head">
      <h2 class="send-panel-title">
        <EditIcon class="send-panel-title-icon" />
        发送文本
      </h2>
      <p class="send-panel-subtitle">把临时文本投递到一个清晰的话题分组里。</p>
    </div>
    <form id="text-form" class="send-panel-form" @submit="handleSubmit">
      <label class="send-field">
        <span class="send-label">标题</span>
        <input v-model="title" type="text" id="text-title" placeholder="给这段文本一个短标题，可留空" maxlength="80" class="send-input">
      </label>

      <div class="send-topic-grid">
        <label class="send-field">
          <span class="send-label">话题</span>
          <select v-model="selectedTopic" data-testid="text-topic-select" class="send-input send-select" :disabled="!hasExistingTopics || Boolean(customTopic.trim())">
            <option value="">{{ hasExistingTopics ? '选择已有话题' : '暂无话题' }}</option>
            <option v-for="topic in topicSuggestions" :key="topic" :value="topic">{{ topic }}</option>
          </select>
        </label>
        <label class="send-field">
          <span class="send-label">新话题</span>
          <input
            v-model="customTopic"
            data-testid="text-topic"
            type="text"
            placeholder="输入后自动创建"
            maxlength="50"
            class="send-input"
            @input="handleCustomTopicInput"
          >
        </label>
      </div>

      <div class="send-kind-row">
        <div class="send-kind-toggle" aria-label="内容类型">
          <button type="button" class="send-kind-btn" :class="contentKind === 'text' ? 'send-kind-btn--active' : ''" @click="contentKind = 'text'">普通文本</button>
          <button type="button" class="send-kind-btn" :class="contentKind === 'code' ? 'send-kind-btn--active' : ''" @click="contentKind = 'code'">代码片段</button>
        </div>
        <select v-if="contentKind === 'code'" v-model="language" data-testid="text-language" class="send-input send-select send-language-select">
          <option value="">自动识别</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="json">JSON</option>
          <option value="bash">Shell</option>
          <option value="css">CSS</option>
          <option value="xml">HTML/XML</option>
          <option value="go">Go</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="sql">SQL</option>
          <option value="markdown">Markdown</option>
          <option value="yaml">YAML</option>
        </select>
      </div>

      <label class="send-field send-field--content">
        <span class="send-label">正文</span>
        <textarea v-model="content" id="text-content" placeholder="粘贴或输入要同步的文本..." rows="6" maxlength="50000" class="send-input send-textarea"></textarea>
      </label>

      <button type="submit" id="text-submit-btn" class="send-panel-submit" :disabled="props.submitting">
        <SendIcon class="send-panel-submit-icon" />
        {{ props.submitting ? "发送中..." : "发送" }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.send-panel {
  padding: 14px;
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  background: color-mix(in srgb, var(--bg-card) 84%, transparent);
  box-shadow: none;
}

.send-panel-head {
  display: grid;
  gap: 4px;
  margin-bottom: 12px;
}

.send-panel-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.send-panel-form {
  display: grid;
  gap: 12px;
}

.send-field {
  display: grid;
  gap: 7px;
}

.send-label {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.send-topic-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}

.send-kind-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.send-kind-toggle {
  display: inline-flex;
  flex: 0 0 auto;
  padding: 3px;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  background: var(--input-bg);
}

.send-kind-btn {
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
}

.send-kind-btn--active {
  background: rgba(var(--accent-rgb), 0.14);
  color: var(--text-accent);
}

.send-language-select {
  min-height: 36px;
  max-width: 160px;
  padding-top: 7px;
  padding-bottom: 7px;
}

.send-input {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  background: var(--input-bg);
  color: var(--text-main);
  font-size: 14px;
  line-height: 1.45;
  padding: 10px 12px;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}

.send-input::placeholder {
  color: var(--text-muted);
}

.send-input:focus {
  border-color: rgba(var(--accent-rgb), 0.65);
  background: var(--bg-card);
  box-shadow: 0 0 0 4px rgba(var(--accent-rgb), 0.12);
}

.send-input:disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

.send-select {
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--text-muted) 50%), linear-gradient(135deg, var(--text-muted) 50%, transparent 50%);
  background-position: calc(100% - 18px) 17px, calc(100% - 13px) 17px;
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  padding-right: 34px;
}

.send-textarea {
  min-height: 132px;
  resize: vertical;
}

@media (max-width: 720px) {
  .send-panel {
    padding: 16px;
  }

  .send-topic-grid {
    grid-template-columns: 1fr;
  }

  .send-kind-row {
    align-items: stretch;
    flex-direction: column;
  }

  .send-language-select {
    max-width: none;
  }
}
</style>
