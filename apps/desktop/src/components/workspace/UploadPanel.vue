<script setup lang="ts">
import { ref } from "vue";
export interface UploadQueueViewItem {
  id: string;
  fileName: string;
  status: "queued" | "preparing" | "uploading" | "completing" | "done" | "failed";
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
  preparing: { text: "准备上传", color: "text-cyan-400" },
  uploading: { text: "上传中", color: "text-violet-400" },
  completing: { text: "完成确认", color: "text-amber-400" },
  done: { text: "已完成", color: "text-emerald-400" },
  failed: { text: "失败", color: "text-red-400" },
};
</script>

<template>
  <div :class="props.compact ? 'p-4' : 'flex-1 flex flex-col min-h-0 p-4 sm:p-5'">
    <h2 class="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
      <svg class="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
      </svg>
      上传文件
    </h2>

    <div id="upload-dropzone" class="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer transition-all hover:border-slate-500 hover:bg-slate-800/30 mb-4" @click="chooseFiles" @dragover="handleDragOver" @drop="handleDrop">
      <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
        <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
        </svg>
      </div>
      <p class="text-sm text-slate-300 font-medium mb-1">拖拽文件到这里</p>
      <p class="text-xs text-slate-500">或点击选择文件</p>
      <input ref="fileInputRef" type="file" id="file-input" class="hidden" multiple @change="handleFileInputChange">
    </div>

    <div class="flex items-center justify-between mb-2">
      <span class="text-xs text-slate-400">上传队列</span>
      <button id="queue-clear-btn" class="text-xs text-violet-400 hover:text-violet-300 transition-colors" @click="emit('clear-finished')">清理已完成</button>
    </div>

    <div id="upload-queue" :class="[props.compact ? '' : 'flex-1 overflow-y-auto custom-scrollbar min-h-0', 'space-y-2']">
      <div v-if="props.queueItems.length === 0" class="text-center py-8 text-slate-500 text-sm">
        <svg class="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
        </svg>
        队列为空
      </div>
      <div v-else v-for="item in props.queueItems" :key="item.id" class="rounded-lg border border-slate-700/60 bg-slate-900/50 p-2.5">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm text-slate-200 truncate">{{ item.fileName }}</p>
            <p class="text-xs" :class="statusMap[item.status].color">{{ statusMap[item.status].text }}</p>
          </div>
          <button v-if="item.status === 'failed'" class="text-xs text-violet-300 hover:text-violet-200 transition-colors" @click="emit('retry', item.id)">重试</button>
        </div>
        <p v-if="item.error" class="text-xs text-red-400 mt-1 break-all">{{ item.error }}</p>
      </div>
    </div>
  </div>
</template>
