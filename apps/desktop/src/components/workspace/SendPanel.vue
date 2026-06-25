<script setup lang="ts">
import { computed, ref, watch } from "vue";
import EditIcon from "../../assets/icons/edit.svg";
import SendIcon from "../../assets/icons/send.svg";
import DropdownSelect from "./DropdownSelect.vue";

interface DropdownOption {
  label: string;
  value: string;
  count?: number;
}

const languageOptions: DropdownOption[] = [
  { label: "自动识别", value: "" },
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "JSON", value: "json" },
  { label: "Shell", value: "bash" },
  { label: "CSS", value: "css" },
  { label: "HTML/XML", value: "xml" },
  { label: "Go", value: "go" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "SQL", value: "sql" },
  { label: "Markdown", value: "markdown" },
  { label: "YAML", value: "yaml" },
];

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

const topicOptions = computed<DropdownOption[]>(() => [
  { label: hasExistingTopics.value ? "选择已有话题" : "暂无话题", value: "" },
  ...props.topicSuggestions.map((topic) => ({ label: topic, value: topic })),
]);

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
        <SendIcon class="send-panel-title-icon" />
        快速投递
      </h2>
      <p class="send-panel-subtitle">粘贴内容，立即同步到剪贴板</p>
    </div>
    <form id="text-form" class="send-panel-form" @submit="handleSubmit">
      <div class="send-kind-row">
        <div class="send-kind-toggle" aria-label="内容类型">
          <button type="button" class="send-kind-btn" :class="contentKind === 'text' ? 'send-kind-btn--active' : ''" @click="contentKind = 'text'">文本</button>
          <button type="button" class="send-kind-btn" :class="contentKind === 'code' ? 'send-kind-btn--active' : ''" @click="contentKind = 'code'">代码片段</button>
        </div>
      </div>

      <div class="editor-wrap" :class="contentKind === 'code' ? 'editor-wrap--code' : ''">
        <textarea
          v-model="content"
          id="text-content"
          placeholder="粘贴文字、链接、验证码或临时备注..."
          rows="6"
          maxlength="5000"
          class="editor-textarea"
        ></textarea>
        <div class="editor-meta">
          <div v-if="contentKind === 'code'" class="editor-language">
            <DropdownSelect
              v-model="language"
              :options="languageOptions"
              compact
              test-id="text-language"
              menu-test-id="text-language-menu"
            />
          </div>
          <span v-else>Ctrl + Enter 快速发送</span>
          <span>{{ content.length }}/5000</span>
        </div>
      </div>

      <details class="send-advanced">
        <summary class="send-advanced-summary">
          <EditIcon class="send-advanced-icon" />
          添加标题和话题
        </summary>
        <div class="send-advanced-body">
          <label class="send-field">
            <span class="send-label">标题</span>
            <input v-model="title" type="text" id="text-title" placeholder="给这段文本一个短标题，可留空" maxlength="80" class="send-input">
          </label>

          <div class="send-topic-grid">
            <div class="send-field">
              <span class="send-label">话题</span>
              <DropdownSelect
                v-model="selectedTopic"
                :options="topicOptions"
                :disabled="!hasExistingTopics || Boolean(customTopic.trim())"
                test-id="text-topic-select"
                menu-test-id="text-topic-select-menu"
              />
            </div>
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
        </div>
      </details>

      <button type="submit" id="text-submit-btn" class="send-panel-submit" :disabled="props.submitting">
        <SendIcon class="send-panel-submit-icon" />
        {{ props.submitting ? "发送中..." : "发送" }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.send-panel {
  padding: 18px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-card);
  background: var(--bg-card);
}

.send-panel-head {
  display: grid;
  gap: 4px;
  margin-bottom: 16px;
}

.send-panel-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
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
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.send-topic-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
  gap: 10px;
}

.send-kind-row {
  display: block;
}

.send-kind-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
  height: 42px;
  padding: 4px;
  border-radius: var(--radius-control);
  background: var(--input-bg);
}

.send-kind-btn {
  border-radius: var(--radius-control);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
  padding: 0 10px;
}

.send-kind-btn--active {
  background: var(--bg-card);
  color: var(--text-accent);
}

.send-input {
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-control);
  background: var(--input-bg);
  color: var(--text-main);
  font-size: 14px;
  line-height: 1.45;
  padding: 10px 12px;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}

.send-input::placeholder {
  color: var(--text-subtle);
}

.send-input:focus {
  border-color: rgba(var(--accent-rgb), 0.65);
  background: var(--bg-card);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.14);
}

.send-input:disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

/* ── editor-wrap ── */
.editor-wrap {
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-card);
  background: var(--input-bg);
  padding: 12px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.editor-wrap:focus-within {
  border-color: rgba(var(--accent-rgb), 0.45);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.11);
  background: var(--bg-card);
}

.editor-textarea {
  width: 100%;
  min-height: 160px;
  resize: vertical;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-main);
  font-size: 14px;
  line-height: 1.72;
  font-family: inherit;
}

.editor-textarea::placeholder {
  color: var(--text-subtle);
}

.editor-wrap--code .editor-textarea {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.editor-meta {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  color: var(--text-subtle);
  font-size: 12px;
}

.editor-language {
  flex: 0 0 auto;
  min-width: 140px;
}

.send-advanced {
  border-radius: 14px;
  background: var(--input-bg);
}

.send-advanced[open] {
  padding-bottom: 12px;
}

.send-advanced-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  list-style: none;
  padding: 12px 14px;
}

.send-advanced-summary::-webkit-details-marker {
  display: none;
}

.send-advanced-summary::after {
  content: "";
  width: 7px;
  height: 7px;
  margin-left: auto;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg) translateY(-2px);
  opacity: 0.72;
}

.send-advanced[open] .send-advanced-summary::after {
  transform: rotate(225deg) translateY(-2px);
}

.send-advanced-icon {
  width: 14px;
  height: 14px;
  color: var(--text-accent);
}

.send-advanced-body {
  display: grid;
  gap: 10px;
  padding: 0 12px;
}

@media (max-width: 720px) {
  .send-panel {
    padding: 16px;
  }

  .send-kind-row {
    flex-wrap: nowrap;
  }
}
</style>
