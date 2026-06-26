<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

interface DropdownOption {
  label: string;
  value: string;
  count?: number;
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: DropdownOption[];
    placeholder?: string;
    disabled?: boolean;
    testId?: string;
    menuTestId?: string;
    compact?: boolean;
  }>(),
  {
    placeholder: "",
    disabled: false,
    testId: "",
    menuTestId: "",
    compact: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);

const selectedLabel = computed(() => {
  const match = props.options.find((o) => o.value === props.modelValue);
  return match?.label ?? props.placeholder;
});

function toggle(): void {
  if (props.disabled) return;
  open.value = !open.value;
}

function select(value: string): void {
  emit("update:modelValue", value);
  open.value = false;
}

function onDocumentClick(e: MouseEvent): void {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    open.value = false;
  }
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") open.value = false;
}

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
  document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <div ref="rootRef" class="dropdown-select" :class="compact ? 'dropdown-select--compact' : ''">
    <button
      type="button"
      class="dropdown-select-trigger"
      :class="open ? 'dropdown-select-trigger--open' : ''"
      :data-testid="testId"
      :disabled="disabled"
      @click="toggle"
    >
      <span class="dropdown-select-label">{{ selectedLabel }}</span>
      <span class="dropdown-select-arrow">{{ open ? "▴" : "▾" }}</span>
    </button>
    <div
      v-if="open"
      class="dropdown-select-menu custom-scrollbar"
      :data-testid="menuTestId"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="dropdown-select-option"
        :class="option.value === modelValue ? 'dropdown-select-option--active' : ''"
        @click="select(option.value)"
      >
        <span class="dropdown-select-option-label">{{ option.label }}</span>
        <span v-if="option.count !== undefined" class="dropdown-select-option-count">{{ option.count }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dropdown-select {
  position: relative;
  width: 100%;
}

.dropdown-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: 42px;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  background: var(--input-bg);
  color: var(--text-main);
  font-size: 14px;
  font-weight: 600;
  padding: 0 12px;
  text-align: left;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}

:global(.dark) .dropdown-select-trigger {
  border-color: rgba(196, 202, 236, 0.13);
  background: rgba(18, 22, 36, 0.72);
}

.dropdown-select-trigger:hover:not(:disabled) {
  border-color: var(--border-strong);
}

.dropdown-select-trigger--open {
  border-color: rgba(var(--accent-rgb), 0.5);
  background: var(--bg-card);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.12);
}

.dropdown-select-trigger:disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

.dropdown-select--compact .dropdown-select-trigger {
  height: 36px;
  font-size: 13px;
  border-radius: 12px;
  background: var(--bg-card);
  color: var(--text-muted);
  padding: 0 10px;
}

:global(.dark) .dropdown-select--compact .dropdown-select-trigger {
  background: rgba(27, 31, 50, 0.78);
}

.dropdown-select-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-select-arrow {
  flex: 0 0 auto;
  font-size: 10px;
  opacity: 0.7;
}

.dropdown-select-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 160px;
  padding: 6px;
  border: 1px solid var(--border-strong);
  border-radius: 14px;
  background: var(--bg-card);
  box-shadow: var(--shadow-md);
  max-height: 280px;
  overflow-y: auto;
}

:global(.dark) .dropdown-select-menu {
  border-color: rgba(196, 202, 236, 0.18);
  background: rgba(30, 35, 56, 0.96);
  box-shadow: 0 20px 48px rgba(5, 8, 18, 0.42);
  backdrop-filter: blur(18px) saturate(1.16);
  -webkit-backdrop-filter: blur(18px) saturate(1.16);
}

.dropdown-select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-align: left;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.dropdown-select-option:hover {
  background: var(--input-bg);
  color: var(--text-main);
}

:global(.dark) .dropdown-select-option:hover {
  background: rgba(255, 255, 255, 0.055);
}

.dropdown-select-option--active {
  background: var(--accent-soft);
  color: var(--text-accent);
  font-weight: 700;
}

.dropdown-select-option-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-select-option-count {
  flex: 0 0 auto;
  font-size: 11px;
  opacity: 0.7;
}
</style>
