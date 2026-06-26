<script setup lang="ts">
import { ref } from "vue";
import UploadCloudIcon from "../../assets/icons/upload-cloud.svg";
import { showToast } from "../feedback/toast";

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

async function handleQuickUpload(): Promise<void> {
  if (!navigator.clipboard?.read) {
    showToast("当前环境不支持读取剪贴板，请手动选择文件", "error");
    chooseFiles();
    return;
  }
  try {
    const clipboardItems = await navigator.clipboard.read();
    for (const item of clipboardItems) {
      for (const type of item.types) {
        if (type.startsWith("image/") || type.startsWith("application/")) {
          const blob = await item.getType(type);
          const ext = type.split("/")[1] || "bin";
          const file = new File([blob], `clipboard-${Date.now()}.${ext}`, {
            type,
          });
          emit("files-selected", [file]);
          return;
        }
      }
    }
    showToast("剪贴板中无可上传的文件，请手动选择", "error");
    chooseFiles();
  } catch {
    showToast("无法读取剪贴板内容，请手动选择文件", "error");
    chooseFiles();
  }
}
</script>

<template>
  <section
    class="quick-upload"
    @click="handleQuickUpload"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <div class="q-icon">
      <UploadCloudIcon class="q-icon-svg" />
    </div>
    <div>
      <strong>拖拽文件到这里，或点击粘贴</strong>
      <small>支持图片、文档、压缩包等</small>
    </div>
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      multiple
      @change="handleFileInputChange"
      @click.stop
    />
  </section>
</template>

<style scoped>
.quick-upload {
  padding: 15px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg, 15px);
  background: color-mix(in srgb, var(--bg-card) 82%, transparent);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.18s ease;
}

:global(.dark) .quick-upload {
  border-color: rgba(196, 202, 236, 0.18);
  background: rgba(32, 37, 58, 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
}

.quick-upload:hover {
  background: var(--bg-card-hover);
}

:global(.dark) .quick-upload:hover {
  background: rgba(43, 49, 74, 0.76);
}

.q-icon {
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: var(--accent-soft);
  color: var(--text-accent);
  display: grid;
  place-items: center;
  flex: none;
}

:global(.dark) .q-icon {
  background: rgba(var(--accent-rgb), 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.q-icon-svg {
  width: 20px;
  height: 20px;
}

.quick-upload strong {
  display: block;
  font-size: 14px;
  color: var(--text-main);
  margin-bottom: 4px;
}

.quick-upload small {
  color: var(--text-subtle);
}

.hidden {
  display: none;
}
</style>
