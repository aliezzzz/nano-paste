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
const displayLanguage = computed(
  () => highlighted.value.language || props.language || "auto",
);
</script>

<template>
  <div class="code-modal-backdrop" @click="emit('close')">
    <section
      class="code-modal"
      role="dialog"
      aria-modal="true"
      aria-label="代码预览"
      @click.stop
    >
      <button
        type="button"
        class="code-modal-close"
        aria-label="关闭"
        @click="emit('close')"
      >
        ✕
      </button>
      <header class="code-modal-head">
        <div>
          <h2 class="code-modal-title">{{ props.title || "代码预览" }}</h2>
          <p class="code-modal-subtitle">{{ displayLanguage }}</p>
        </div>
      </header>
      <pre class="code-block"><code v-html="highlighted.html"></code></pre>
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
  position: relative;
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
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 14px 16px;
  padding-right: 48px;
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
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: #c9d1d9;
  font-size: 16px;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.code-modal-close:hover {
  background: rgba(255, 255, 255, 0.18);
}

.code-block {
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 18px;
  font-size: 13px;
  line-height: 1.6;
  tab-size: 2;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 720px) {
  .code-modal-backdrop {
    padding: 8px;
  }

  .code-modal {
    width: 100%;
    height: calc(100dvh - 16px);
    border-radius: 16px;
  }

  .code-modal-head {
    padding: 12px;
    padding-right: 44px;
  }

  .code-modal-close {
    top: 8px;
    right: 8px;
  }

  .code-block {
    padding: 14px;
    font-size: 12px;
  }
}
</style>
