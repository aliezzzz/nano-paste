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
  gap: 6px;
  height: 28px;
  margin: 0;
}

.topic-edit-input {
  flex: 1;
  min-width: 0;
  height: 28px;
  box-sizing: border-box;
  padding: 0 10px;
  border: 1.5px solid var(--text-accent);
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--text-main);
  font-size: 12px;
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.1);
}

.topic-edit-btn {
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.topic-edit-btn--save {
  background: rgba(var(--accent-rgb), 0.15);
  color: var(--text-accent);
}

.topic-edit-btn--save:hover {
  background: rgba(var(--accent-rgb), 0.25);
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
  gap: 6px;
  margin: 0;
}

.meta-topic {
  border-radius: 999px;
  background: rgba(var(--accent-rgb), 0.15);
  color: var(--text-accent);
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.meta-topic:hover {
  background: rgba(var(--accent-rgb), 0.25);
}

.meta-topic--empty {
  background: var(--border-soft);
  color: var(--text-muted);
  font-weight: 500;
  opacity: 0.6;
  transition: opacity 0.15s ease;
}

.meta-topic--empty:hover {
  opacity: 1;
}

.meta-tag {
  border-radius: 999px;
  background: rgba(var(--accent-rgb), 0.1);
  color: var(--text-accent);
  font-size: 11px;
  padding: 3px 8px;
}
</style>
