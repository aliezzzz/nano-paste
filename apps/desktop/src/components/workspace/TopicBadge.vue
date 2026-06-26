<script setup lang="ts">
import { nextTick, ref } from "vue";
import TopicSelect, { type TopicOption } from "./TopicSelect.vue";

const props = withDefaults(
  defineProps<{
    topic?: string;
    tags?: string[];
    topics?: TopicOption[];
  }>(),
  {
    topics: () => [] as TopicOption[],
  },
);

const emit = defineEmits<{
  (e: "update-topic", topic: string): void;
  (e: "edit-start"): void;
  (e: "edit-end"): void;
}>();

const pickerOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const popoverStyle = ref<Record<string, string>>({});

async function openPicker(): Promise<void> {
  if (!triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  popoverStyle.value = {
    position: "fixed",
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${Math.max(rect.width, 200)}px`,
    zIndex: "50",
  };
  pickerOpen.value = true;
  emit("edit-start");
  await nextTick();
}

function closePicker(): void {
  pickerOpen.value = false;
  emit("edit-end");
}

function onSelect(value: string): void {
  emit("update-topic", value);
  closePicker();
}
</script>

<template>
  <div v-if="topic || tags?.length" class="meta-tags">
    <span
      v-if="topic"
      ref="triggerRef"
      class="meta-topic"
      title="点击修改话题"
      @click="openPicker"
    >{{ topic }}</span>
    <span
      v-else
      ref="triggerRef"
      class="meta-topic meta-topic--empty"
      title="点击添加话题"
      @click="openPicker"
    >+话题</span>
    <span v-for="tag in tags" :key="tag" class="meta-tag">#{{ tag }}</span>
  </div>
  <div v-else class="meta-tags">
    <span
      ref="triggerRef"
      class="meta-topic meta-topic--empty"
      title="点击添加话题"
      @click="openPicker"
    >+话题</span>
  </div>

  <Teleport to="body">
    <div v-if="pickerOpen" :style="popoverStyle" class="topic-badge-popover">
      <TopicSelect
        :model-value="props.topic || ''"
        :topics="props.topics"
        :placeholder="topic ? '修改或清空话题' : '选择或创建话题'"
        @update:modelValue="onSelect"
        @close="closePicker"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.meta-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin: 0;
  height: 29px;
}

.meta-topic {
  border-radius: 4px;
  background: var(--accent-soft);
  color: var(--text-accent);
  font-size: 10px;
  font-weight: 600;
  padding: 5px 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.meta-topic:hover {
  color: var(--accent-hover);
}

.meta-topic--empty {
  background: transparent;
  color: var(--text-subtle);
  font-weight: 500;
  opacity: 0.7;
  transition: opacity 0.15s ease;
}

.meta-topic--empty:hover {
  opacity: 1;
  color: var(--text-accent);
}

.meta-tag {
  border-radius: 4px;
  background: var(--input-bg);
  color: var(--text-muted);
  font-size: 10px;
  padding: 2px 5px;
}

.topic-badge-popover {
  /* position / top / left / width / z-index 由 inline style 提供 */
}
</style>
