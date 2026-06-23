<script setup lang="ts">
import { computed } from "vue";
import { highlightCode } from "../../utils/code-highlight";

const props = defineProps<{
  title?: string;
  code: string;
  language?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const highlighted = computed(() => highlightCode(props.code, props.language));
const displayLanguage = computed(() => highlighted.value.language || props.language || "auto");
</script>

<template>
  <div class="code-modal-backdrop" tabindex="-1" @click.self="emit('close')" @keydown.escape="emit('close')">
    <section class="code-modal" role="dialog" aria-modal="true" aria-label="代码预览">
      <header class="code-modal-head">
        <div>
          <h2 class="code-modal-title">{{ props.title || '代码预览' }}</h2>
          <p class="code-modal-subtitle">{{ displayLanguage }}</p>
        </div>
        <button type="button" class="code-modal-close" @click="emit('close')">关闭</button>
      </header>
      <pre class="code-block" tabindex="0"><code v-html="highlighted.html"></code></pre>
    </section>
  </div>
</template>

<style scoped>
.code-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.58);
  padding: 24px;
}

.code-modal {
  width: min(920px, 100%);
  height: min(720px, calc(100dvh - 48px));
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-strong);
  border-radius: 22px;
  background: #0d1117;
  color: #e6edf3;
  overflow: hidden;
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.42);
}

.code-modal-head {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 14px 16px;
}

.code-modal-title {
  margin: 0;
  font-size: 15px;
}

.code-modal-subtitle {
  margin: 3px 0 0;
  color: #8b949e;
  font-size: 12px;
}

.code-modal-close {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #c9d1d9;
  font-size: 12px;
  font-weight: 700;
  padding: 7px 12px;
}

.code-block {
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 18px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  tab-size: 2;
  -webkit-overflow-scrolling: touch;
}

.code-block:focus {
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(121, 192, 255, 0.32);
}

.code-block :deep(.hljs-keyword),
.code-block :deep(.hljs-selector-tag),
.code-block :deep(.hljs-built_in) {
  color: #ff7b72;
}

.code-block :deep(.hljs-string),
.code-block :deep(.hljs-attr),
.code-block :deep(.hljs-symbol) {
  color: #a5d6ff;
}

.code-block :deep(.hljs-title),
.code-block :deep(.hljs-section),
.code-block :deep(.hljs-name) {
  color: #d2a8ff;
}

.code-block :deep(.hljs-comment),
.code-block :deep(.hljs-quote) {
  color: #8b949e;
}

.code-block :deep(.hljs-number),
.code-block :deep(.hljs-literal) {
  color: #79c0ff;
}

@media (max-width: 720px) {
  .code-modal-backdrop {
    padding: 12px;
  }

  .code-modal {
    width: 100%;
    height: calc(100dvh - 24px);
    border-radius: 18px;
  }

  .code-modal-head {
    padding: 12px;
  }

  .code-block {
    padding: 14px;
    font-size: 12px;
  }
}
</style>
