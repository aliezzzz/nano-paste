<script setup lang="ts">
import { ref } from "vue";
import UploadCloudIcon from "../../assets/icons/upload-cloud.svg";
export interface UploadQueueViewItem {
  id: string;
  fileName: string;
  status: "queued" | "uploading" | "done" | "failed" | "cancelled";
  error?: string;
  progress: number;
}

const props = withDefaults(
  defineProps<{ compact?: boolean; queueItems?: UploadQueueViewItem[] }>(),
  {
    compact: false,
    queueItems: () => [],
  },
);

const emit = defineEmits<{
  (e: "clear-finished"): void;
  (e: "retry", id: string): void;
  (e: "cancel", id: string): void;
  (e: "files-selected", files: File[]): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);

function chooseFiles(): void {
  fileInputRef.value?.click();
}

function handleFileInputChange(e: Event): void {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  if (files.length > 0) {
    emit("files-selected", files);
  }
  input.value = "";
}

function handleDrop(e: DragEvent): void {
  e.preventDefault();
  const files = Array.from(e.dataTransfer?.files || []);
  if (files.length > 0) {
    emit("files-selected", files);
  }
}

function handleDragOver(e: DragEvent): void {
  e.preventDefault();
}
</script>

<template>
  <div class="upload-panel">
    <h2 class="upload-panel-title">
      <UploadCloudIcon class="upload-panel-title-icon" />
      上传文件
    </h2>

    <div
      id="upload-dropzone"
      class="upload-dropzone"
      @click="chooseFiles"
      @dragover="handleDragOver"
      @drop="handleDrop"
    >
      <div class="upload-dropzone-icon-wrap">
        <UploadCloudIcon class="upload-dropzone-icon" />
      </div>
      <p class="upload-dropzone-title">拖拽文件到这里</p>
      <p class="upload-dropzone-hint">或点击选择文件</p>
      <input
        ref="fileInputRef"
        type="file"
        id="file-input"
        class="hidden"
        multiple
        @change="handleFileInputChange"
      />
    </div>
  </div>
</template>

<style scoped>
.upload-panel {
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-card);
  background: var(--bg-card);
  padding: 12px;
}

.upload-panel-title {
  margin-bottom: 12px;
}

.upload-dropzone {
  margin-bottom: 0;
  border-color: var(--border-soft);
  background: var(--input-bg);
}

.upload-dropzone:hover {
  border-color: rgba(var(--accent-rgb), 0.38);
  background: var(--accent-soft);
}

.upload-dropzone-icon-wrap {
  color: var(--text-accent);
}

.hidden {
  display: none;
}
</style>
