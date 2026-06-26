<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

export interface TopicOption {
  name: string;
  count: number;
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    topics: TopicOption[];
    placeholder?: string;
    disabled?: boolean;
    allowClear?: boolean;
    emptyText?: string;
    testId?: string;
    menuTestId?: string;
  }>(),
  {
    placeholder: "选择或创建话题",
    disabled: false,
    allowClear: true,
    emptyText: "还没有话题，输入即可创建",
    testId: "",
    menuTestId: "",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "create", name: string): void;
  (e: "open"): void;
  (e: "close"): void;
}>();

const open = ref(false);
const query = ref("");
const highlightedIndex = ref(0);
const triggerRef = ref<HTMLElement | null>(null);

const trimmedQuery = computed(() => query.value.trim());
const filtered = computed(() => {
  const q = trimmedQuery.value.toLowerCase();
  if (!q) return props.topics;
  return props.topics.filter((t) => t.name.toLowerCase().includes(q));
});
const showCreateRow = computed(
  () => trimmedQuery.value.length > 0 && filtered.value.length === 0,
);
interface DisplayItem {
  __create?: boolean;
  name: string;
  count: number;
}
const displayItems = computed<DisplayItem[]>(() => {
  if (showCreateRow.value) {
    return [
      { __create: true, name: trimmedQuery.value, count: 0 },
      ...filtered.value,
    ];
  }
  return filtered.value;
});
const displayLabel = computed(() => {
  if (props.modelValue) return props.modelValue;
  return props.placeholder;
});

function toggleOpen(): void {
  if (props.disabled) return;
  if (open.value) {
    closeMenu();
  } else {
    openMenu();
  }
}

function openMenu(): void {
  open.value = true;
  query.value = props.modelValue;
  highlightedIndex.value = 0;
  emit("open");
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onEscKey);
  window.addEventListener("resize", closeMenu);
  window.addEventListener("scroll", closeMenu, true);
}

function closeMenu(): void {
  if (!open.value) return;
  open.value = false;
  query.value = props.modelValue;
  emit("close");
  document.removeEventListener("click", onDocumentClick);
  document.removeEventListener("keydown", onEscKey);
  window.removeEventListener("resize", closeMenu);
  window.removeEventListener("scroll", closeMenu, true);
}

function onDocumentClick(e: MouseEvent): void {
  const target = e.target as HTMLElement | null;
  const root = target?.closest(".topic-select");
  if (!root) closeMenu();
}

function onEscKey(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    e.stopPropagation();
    closeMenu();
  }
}

function clearValue(): void {
  emit("update:modelValue", "");
  query.value = "";
}

interface SelectableItem {
  __create?: boolean;
  name: string;
  count: number;
}

function selectItem(item: SelectableItem): void {
  if (item.__create) {
    const name = item.name;
    emit("update:modelValue", name);
    emit("create", name);
    query.value = name;
  } else {
    emit("update:modelValue", item.name);
    query.value = item.name;
  }
  closeMenu();
}

function onKeydown(e: KeyboardEvent): void {
  const len = displayItems.value.length;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (len > 0) {
      highlightedIndex.value = (highlightedIndex.value + 1) % len;
    }
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (len > 0) {
      highlightedIndex.value = (highlightedIndex.value - 1 + len) % len;
    }
  } else if (e.key === "Enter") {
    e.preventDefault();
    const target = displayItems.value[highlightedIndex.value];
    if (target) selectItem(target);
  } else if (e.key === "Escape") {
    e.preventDefault();
    closeMenu();
  } else if (e.key === "Tab") {
    closeMenu();
  }
}

watch(query, () => {
  highlightedIndex.value = 0;
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
  document.removeEventListener("keydown", onEscKey);
  window.removeEventListener("resize", closeMenu);
  window.removeEventListener("scroll", closeMenu, true);
});
</script>

<template>
  <div class="topic-select">
    <button
      ref="triggerRef"
      type="button"
      class="topic-select-trigger"
      :class="open ? 'topic-select-trigger--open' : ''"
      :disabled="disabled"
      :data-testid="testId"
      @click="toggleOpen"
    >
      <span
        class="topic-select-label"
        :class="modelValue ? '' : 'topic-select-label--placeholder'"
      >{{ displayLabel }}</span>
      <span
        v-if="allowClear && modelValue"
        class="topic-select-clear"
        title="清空话题"
        @click.stop="clearValue"
      >×</span>
      <span class="topic-select-arrow">{{ open ? "▴" : "▾" }}</span>
    </button>

    <div
      v-if="open"
      class="topic-select-menu custom-scrollbar"
      :data-testid="menuTestId"
    >
      <input
        v-model="query"
        type="text"
        class="topic-select-input"
        placeholder="输入以过滤或创建"
        maxlength="50"
        autocomplete="off"
        @keydown="onKeydown"
      >
      <div class="topic-select-options">
        <button
          v-for="(item, index) in displayItems"
          :key="item.__create ? '__create' : item.name"
          type="button"
          class="topic-select-option"
          :class="[
            item.__create ? 'topic-select-option--create' : '',
            index === highlightedIndex ? 'topic-select-option--active' : '',
            !item.__create && item.name === modelValue
              ? 'topic-select-option--selected'
              : '',
          ]"
          @click="selectItem(item)"
          @mouseenter="highlightedIndex = index"
        >
          <template v-if="item.__create">
            <span class="topic-select-create-icon">+</span>
            <span class="topic-select-create-text">创建 <b>{{ item.name }}</b></span>
          </template>
          <template v-else>
            <span class="topic-select-option-label">{{ item.name }}</span>
            <span class="topic-select-option-count">{{ item.count }}</span>
          </template>
        </button>
        <div
          v-if="displayItems.length === 0"
          class="topic-select-empty"
        >{{ emptyText }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.topic-select {
  display: inline-block;
  width: 100%;
  min-width: 0;
  position: relative;
}
.topic-select-trigger {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  height: 42px;
  padding: 0 10px 0 12px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-control);
  background: var(--input-bg);
  color: var(--text-main);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}
.topic-select-trigger:hover {
  border-color: var(--border-strong);
}
.topic-select-trigger--open {
  border-color: rgba(var(--accent-rgb), 0.4);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
}
.topic-select-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.topic-select-label {
  flex: 1;
  min-width: 0;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topic-select-label--placeholder {
  color: var(--text-muted);
  font-weight: 500;
}
.topic-select-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: 4px;
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
}
.topic-select-clear:hover {
  background: var(--border-soft);
  color: var(--text-main);
}
.topic-select-arrow {
  margin-left: 4px;
  color: var(--text-muted);
  font-size: 10px;
}
.topic-select-menu {
  position: absolute;
  z-index: 50;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 280px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-card);
  background: var(--bg-card);
  box-shadow: 0 12px 36px rgba(5, 8, 18, 0.16);
  overflow: hidden;
}
:global(.dark) .topic-select-menu {
  background: rgba(23, 27, 45, 0.96);
  border-color: rgba(192, 199, 235, 0.14);
}
.topic-select-input {
  flex: 0 0 auto;
  height: 38px;
  margin: 8px 8px 4px;
  padding: 0 10px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-control);
  background: var(--input-bg);
  color: var(--text-main);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  outline: none;
  box-sizing: border-box;
}
.topic-select-input:focus {
  border-color: rgba(var(--accent-rgb), 0.4);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
}
.topic-select-options {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 6px 6px;
}
.topic-select-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--text-main);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.12s ease;
}
.topic-select-option:hover,
.topic-select-option--active {
  background: var(--border-soft);
}
.topic-select-option--selected {
  color: var(--text-accent);
  font-weight: 700;
}
.topic-select-option--create {
  border: 1px dashed var(--border-strong);
  margin-bottom: 4px;
  color: var(--text-accent);
}
.topic-select-create-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--text-accent);
  font-size: 12px;
  line-height: 1;
}
.topic-select-create-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topic-select-option-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topic-select-option-count {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 500;
}
.topic-select-empty {
  padding: 16px 12px;
  color: var(--text-muted);
  font-size: 12px;
  text-align: center;
}
</style>
