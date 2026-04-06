<script setup lang="ts">
import { ref } from "vue";
export interface UploadQueueViewItem {
  id: string;
  fileName: string;
  status: "queued" | "uploading" | "done" | "failed";
  error?: string;
}

const props = withDefaults(defineProps<{ compact?: boolean; queueItems?: UploadQueueViewItem[] }>(), {
  compact: false,
  queueItems: () => [],
});

const emit = defineEmits<{
  (e: "clear-finished"): void;
  (e: "retry", id: string): void;
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

const statusMap: Record<UploadQueueViewItem["status"], { text: string; color: string }> = {
  queued: { text: "等待中", color: "text-slate-400" },
  uploading: { text: "上传中", color: "text-violet-400" },
  done: { text: "已完成", color: "text-emerald-400" },
  failed: { text: "失败", color: "text-red-400" },
};
</script>

<template>
  <div :class="props.compact ? 'upload-panel' : 'upload-panel upload-panel--full'">
    <h2 class="upload-panel-title">
      <svg class="upload-panel-title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
      </svg>
      上传文件
    </h2>

    <div id="upload-dropzone" class="upload-dropzone" @click="chooseFiles" @dragover="handleDragOver" @drop="handleDrop">
      <div class="upload-dropzone-icon-wrap">
        <svg class="upload-dropzone-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
        </svg>
      </div>
      <p class="upload-dropzone-title">拖拽文件到这里</p>
      <p class="upload-dropzone-hint">或点击选择文件</p>
      <input ref="fileInputRef" type="file" id="file-input" class="hidden" multiple @change="handleFileInputChange">
    </div>

    <div class="upload-queue-header">
      <span class="upload-queue-title">上传队列</span>
      <button id="queue-clear-btn" class="upload-queue-clear" @click="emit('clear-finished')">清理已完成</button>
    </div>

    <div id="upload-queue" :class="[props.compact ? 'upload-queue' : 'upload-queue upload-queue--full custom-scrollbar']">
      <div v-if="props.queueItems.length === 0" class="upload-queue-empty">
        <svg class="upload-queue-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
        </svg>
        队列为空
      </div>
      <div v-else v-for="item in props.queueItems" :key="item.id" class="upload-queue-item">
        <div class="upload-queue-item-head">
          <div class="upload-queue-item-info">
            <p class="upload-queue-item-name">{{ item.fileName }}</p>
            <p class="upload-queue-item-status inline-flex items-center gap-2" :class="statusMap[item.status].color">
              <svg v-if="item.status === 'uploading'" class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" opacity="0.28"></circle>
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              </svg>
              {{ statusMap[item.status].text }}
            </p>
          </div>
          <button v-if="item.status === 'failed'" class="upload-queue-retry" @click="emit('retry', item.id)">重试</button>
        </div>
        <p v-if="item.error" class="upload-queue-error">{{ item.error }}</p>
      </div>
    </div>
  </div>
</template>
