<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { formatBytes } from "../../shared/format";

export interface ItemView {
  id: string;
  type: "text" | "file";
  title?: string;
  content?: string;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  isFavorite: boolean;
  createdAt: string;
  iconSvg: string;
}

type ItemActionPayload = {
  id: string;
  action: "copy" | "download" | "delete" | "favorite";
  type: "text" | "file";
  content?: string;
  fileId?: string;
  fileName?: string;
  isFavorite: boolean;
};

const props = withDefaults(defineProps<{ items?: ItemView[]; loading?: boolean }>(), {
  items: () => [],
  loading: false,
});

const emit = defineEmits<{
  (e: "item-action", payload: ItemActionPayload): void;
  (e: "refresh-items"): void;
}>();

const favoriteOnly = ref(false);
const rotating = ref(false);
let rotateTimer: number | null = null;

const visibleItems = computed(() => {
  if (!favoriteOnly.value) {
    return props.items;
  }
  return props.items.filter((item) => item.isFavorite);
});

function refreshItems(): void {
  if (props.loading) {
    return;
  }

  rotating.value = true;
  if (rotateTimer !== null) {
    window.clearTimeout(rotateTimer);
  }
  rotateTimer = window.setTimeout(() => {
    rotating.value = false;
    rotateTimer = null;
  }, 620);

  emit("refresh-items");
}

onBeforeUnmount(() => {
  if (rotateTimer !== null) {
    window.clearTimeout(rotateTimer);
    rotateTimer = null;
  }
});
</script>

<template>
  <div class="items-panel">
    <div class="panel-header">
      <h2 class="panel-title">
        <svg class="panel-title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        最近条目
      </h2>
      <div class="panel-actions">
        <button
          type="button"
          class="refresh-btn"
          :class="props.loading ? 'refresh-btn--loading' : 'refresh-btn--idle'"
          :disabled="props.loading"
          title="刷新条目"
          @click="refreshItems"
        >
          <svg
            class="refresh-icon"
            :class="rotating ? 'refresh-icon--rotating' : ''"
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M499.72 872.52c-179.31 0-325.19-143.88-325.19-320.75 0-176.84 145.88-320.72 325.19-320.72 54.31 0 108.12 13.5 155.62 39.03 23.31 12.56 32.06 41.69 19.5 65.03-12.44 23.38-41.56 32.12-65 19.53-33.56-18.06-71.62-27.59-110.12-27.59-126.38 0-229.19 100.81-229.19 224.72 0 123.94 102.81 224.75 229.19 224.75 104.5 0 195.75-69.22 221.87-168.31 6.81-25.62 33.12-40.88 58.69-34.16 25.62 6.78 40.94 33.03 34.19 58.66-37.32 141.18-166.75 239.81-314.75 239.81z" fill="currentColor"></path>
            <path d="M799.24 407.04l-89.26-228.19c-6.2-15.85-27.38-18.78-37.64-5.2l-154.62 204.6c-10.26 13.58-1.67 33.16 15.27 34.8l243.89 23.59c16.15 1.57 28.27-14.48 22.36-29.6z" fill="currentColor"></path>
          </svg>
        </button>

        <div class="filter-tabs">
          <button
            type="button"
            class="filter-tab"
            :class="!favoriteOnly ? 'filter-tab--active' : 'filter-tab--inactive'"
            @click="favoriteOnly = false"
          >
            全部
          </button>
          <button
            type="button"
            class="filter-tab"
            :class="favoriteOnly ? 'filter-tab--favorite-active' : 'filter-tab--favorite-inactive'"
            @click="favoriteOnly = true"
          >
            仅收藏
          </button>
        </div>
      </div>
    </div>

    <p id="items-loading" class="loading-text" :class="props.loading ? '' : 'hidden'">加载中...</p>
    
    <div class="list-container">
      <div id="items-list" class="items-list custom-scrollbar">
        <div v-for="item in visibleItems" :key="item.id" class="item-card">
          <div class="item-layout">
            <!-- 左侧图标 -->
            <div class="item-icon" v-html="item.iconSvg"></div>
            
            <!-- 右侧内容区 -->
            <div class="item-content">
              <!-- 标题行：标题/文件名 + [类型] + [大小] + [★] -->
              <div class="item-header">
                <div class="item-title">
                  {{ item.type === 'text' ? (item.title || '无标题') : (item.fileName || '无文件名') }}
                </div>
                
                <!-- 右侧标签组：[类型] + [大小] + [收藏] -->
                <div class="item-meta">
                  <!-- 类型标签 -->
                  <span
                    class="type-badge"
                    :class="item.type === 'text' ? 'type-badge--text' : 'type-badge--file'"
                  >
                    {{ item.type === 'text' ? '文本' : '文件' }}
                  </span>
                  
                  <!-- 文件大小（仅文件） -->
                  <span v-if="item.type === 'file' && item.fileSize" class="file-size">
                    {{ formatBytes(item.fileSize) }}
                  </span>
                  
                  <!-- 收藏按钮 -->
                  <button
                    class="favorite-btn"
                    :class="item.isFavorite ? 'favorite-btn--active' : 'favorite-btn--inactive'"
                    :title="item.isFavorite ? '取消收藏' : '收藏'"
                    @click="emit('item-action', { id: item.id, action: 'favorite', type: item.type, content: item.content, fileId: item.fileId, fileName: item.fileName, isFavorite: item.isFavorite })"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M533.504 268.288q33.792-41.984 71.68-75.776 32.768-27.648 74.24-50.176t86.528-19.456q63.488 5.12 105.984 30.208t67.584 63.488 34.304 87.04 6.144 99.84-17.92 97.792-36.864 87.04-48.64 74.752-53.248 61.952q-40.96 41.984-85.504 78.336t-84.992 62.464-73.728 41.472-51.712 15.36q-20.48 1.024-52.224-14.336t-69.632-41.472-79.872-61.952-82.944-75.776q-26.624-25.6-57.344-59.392t-57.856-74.24-46.592-87.552-21.504-100.352 11.264-99.84 39.936-83.456 65.536-61.952 88.064-35.328q24.576-5.12 49.152-1.536t48.128 12.288 45.056 22.016 40.96 27.648q45.056 33.792 86.016 80.896z" fill="currentColor"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- 内容区：仅文本显示 content -->
              <div v-if="item.type === 'text'" class="item-body">
                <p class="item-text-content">
                  {{ item.content || '无内容' }}
                </p>
              </div>

              <!-- 底部操作栏 -->
              <div class="item-footer">
                <!-- 左侧操作按钮 -->
                <button
                  class="action-btn"
                  :class="item.type === 'text' ? 'action-btn--text' : 'action-btn--file'"
                  @click="emit('item-action', { id: item.id, action: item.type === 'text' ? 'copy' : 'download', type: item.type, content: item.content, fileId: item.fileId, fileName: item.fileName, isFavorite: item.isFavorite })"
                >
                  <svg class="action-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      v-if="item.type === 'text'"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    ></path>
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    ></path>
                  </svg>
                  {{ item.type === 'text' ? '复制' : '下载' }}
                </button>

                <!-- 右侧：时间 + 删除 -->
                <div class="footer-meta">
                  <span class="timestamp">{{ new Date(item.createdAt).toLocaleString('zh-CN') }}</span>
                  <button
                    v-if="!item.isFavorite"
                    class="delete-btn"
                    title="删除"
                    @click="emit('item-action', { id: item.id, action: 'delete', type: item.type, content: item.content, fileId: item.fileId, fileName: item.fileName, isFavorite: item.isFavorite })"
                  >
                    <svg class="delete-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <p v-if="!props.loading && visibleItems.length === 0" id="items-empty" class="empty-state">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          ></path>
        </svg>
        {{ favoriteOnly ? '暂无收藏条目' : '暂无条目' }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.refresh-icon--rotating {
  animation: refresh-spin-once 620ms ease-in-out 1;
}

@keyframes refresh-spin-once {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.item-text-content {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
