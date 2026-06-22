<script setup lang="ts">
import FolderIcon from "../../assets/icons/folder.svg";

export interface TopicInfo {
  name: string;
  count: number;
}

const props = withDefaults(defineProps<{
  topics?: TopicInfo[];
  activeTopic?: string;
}>(), {
  topics: () => [],
  activeTopic: "",
});

const emit = defineEmits<{
  (e: "select-topic", topic: string): void;
}>();

function selectTopic(topic: string): void {
  emit("select-topic", topic);
}
</script>

<template>
  <div class="topic-list">
    <h3 class="topic-list-title">
      <FolderIcon class="topic-list-title-icon" />
      话题分组
    </h3>
    <div class="topic-items">
      <button
        type="button"
        class="topic-item"
        :class="activeTopic === '' ? 'topic-item--active' : ''"
        @click="selectTopic('')"
      >
        <span class="topic-item-name">全部</span>
      </button>
      <button
        v-for="topic in topics"
        :key="topic.name"
        type="button"
        class="topic-item"
        :class="activeTopic === topic.name ? 'topic-item--active' : ''"
        @click="selectTopic(topic.name)"
      >
        <span class="topic-item-name">{{ topic.name }}</span>
        <span class="topic-item-count">{{ topic.count }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.topic-list {
  padding: 12px 0;
}

.topic-list-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px 0;
  padding: 0 16px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.topic-list-title-icon {
  width: 14px;
  height: 14px;
}

.topic-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.topic-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-main);
  transition: all 0.15s ease;
  border-left: 3px solid transparent;
}

.topic-item:hover {
  background: var(--border-soft);
}

.topic-item--active {
  background: rgba(var(--accent-rgb), 0.08);
  border-left-color: var(--text-accent);
  color: var(--text-accent);
  font-weight: 600;
}

.topic-item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topic-item-count {
  flex-shrink: 0;
  min-width: 24px;
  padding: 2px 6px;
  border-radius: 10px;
  background: var(--border-soft);
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  color: var(--text-muted);
}

.topic-item--active .topic-item-count {
  background: rgba(var(--accent-rgb), 0.15);
  color: var(--text-accent);
}
</style>
