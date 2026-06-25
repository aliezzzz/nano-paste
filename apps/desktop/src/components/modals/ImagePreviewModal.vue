<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { formatBytes } from "../../utils/format";

const props = defineProps<{
  imageUrl: string;
  fileName: string;
  fileSize?: number;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    emit("close");
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div class="app-modal-wrap app-modal-wrap--image-preview" @click="emit('close')">
    <div class="image-preview-center" @click.stop>
      <div class="image-preview-card">
        <div class="image-preview-header">
          <div class="image-preview-info">
            <h3 class="image-preview-title">{{ fileName }}</h3>
            <p v-if="fileSize" class="image-preview-size">{{ formatBytes(fileSize) }}</p>
          </div>
          <button type="button" class="app-modal-close-btn" @click="emit('close')">✕</button>
        </div>
        <div class="image-preview-body">
          <img :src="imageUrl" :alt="fileName" class="image-preview-img" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-modal-wrap--image-preview {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview-center {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 24px;
}

.image-preview-card {
  display: flex;
  flex-direction: column;
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 18px;
  background: var(--bg-card);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.image-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-soft);
}

.image-preview-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.image-preview-title {
  margin: 0;
  color: #111;
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.dark) .image-preview-title {
  color: #fff;
}

.image-preview-size {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
}

.image-preview-body {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: auto;
}

.image-preview-img {
  max-width: 100%;
  max-height: calc(90vh - 100px);
  object-fit: contain;
  border-radius: 8px;
}
</style>
