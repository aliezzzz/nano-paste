<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  topic?: string;
  tags?: string[];
}>();

const emit = defineEmits<{
  (e: "update-topic", topic: string): void;
  (e: "edit-start"): void;
  (e: "edit-end"): void;
}>();

const editing = ref(false);
const editValue = ref("");

function startEdit(): void {
  editing.value = true;
  editValue.value = props.topic || "";
  emit("edit-start");
}

function cancelEdit(): void {
  editing.value = false;
  editValue.value = "";
  emit("edit-end");
}

function save(): void {
  emit("update-topic", editValue.value.trim());
  editing.value = false;
  editValue.value = "";
  emit("edit-end");
}
</script>

<template>
  <div v-if="editing" class="topic-edit">
    <input
      v-model="editValue"
      class="topic-edit-input"
      placeholder="输入话题"
      maxlength="50"
      autofocus
      @keyup.enter="save"
      @keyup.escape="cancelEdit"
    >
    <button class="topic-edit-btn topic-edit-btn--save" @click="save">保存</button>
    <button class="topic-edit-btn topic-edit-btn--cancel" @click="cancelEdit">取消</button>
  </div>
  <div v-else-if="topic || tags?.length" class="meta-tags">
    <span v-if="topic" class="meta-topic" title="点击编辑话题" @click="startEdit">{{ topic }}</span>
    <span v-else class="meta-topic meta-topic--empty" title="点击添加话题" @click="startEdit">+话题</span>
    <span v-for="tag in tags" :key="tag" class="meta-tag">#{{ tag }}</span>
  </div>
  <div v-else class="meta-tags">
    <span class="meta-topic meta-topic--empty" title="点击添加话题" @click="startEdit">+话题</span>
  </div>
</template>

<style scoped>
.topic-edit {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  margin: 0;
}

.topic-edit-input {
  flex: 1;
  min-width: 0;
  height: 26px;
  box-sizing: border-box;
  padding: 0 8px;
  border: 1px solid var(--text-accent);
  border-radius: 6px;
  background: var(--bg-card);
  color: var(--text-main);
  font-size: 11px;
  outline: none;
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.topic-edit-btn {
  height: 26px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.topic-edit-btn--save {
  background: var(--accent-soft);
  color: var(--text-accent);
}

.topic-edit-btn--save:hover {
  color: var(--accent-hover);
}

.topic-edit-btn--cancel {
  background: var(--border-soft);
  color: var(--text-muted);
}

.topic-edit-btn--cancel:hover {
  background: var(--border-strong);
}

.meta-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin: 0;
}

.meta-topic {
  border-radius: 4px;
  background: var(--accent-soft);
  color: var(--text-accent);
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
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
</style>
