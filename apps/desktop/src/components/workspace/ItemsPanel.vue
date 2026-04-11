<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { formatBytes } from "../../utils/format";
import type { ItemView, ItemActionPayload } from "../../types/workspace";
import ClockIcon from "../../assets/icons/clock.svg";
import RefreshIcon from "../../assets/icons/refresh.svg";
import StarIcon from "../../assets/icons/star.svg";
import CopyIcon from "../../assets/icons/copy.svg";
import DownloadIcon from "../../assets/icons/download.svg";
import DeleteIcon from "../../assets/icons/delete.svg";
import InboxEmptyIcon from "../../assets/icons/inbox-empty.svg";

export type { ItemView };

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

function formatItemTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
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
        <ClockIcon class="panel-title-icon" />
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
          <RefreshIcon
            class="refresh-icon"
            :class="rotating ? 'refresh-icon--rotating' : ''"
            aria-hidden="true"
          />
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
        <div v-for="item in visibleItems" :key="item.id" class="item-card group">
          <div class="item-layout">
            <!-- 左侧图标 -->
            <div class="item-icon" v-html="item.iconSvg"></div>
            
            <!-- 右侧内容区 -->
            <div class="item-content">
              <!-- 标题行：标题/文件名 + 收藏 -->
              <div class="item-header">
                <div :class="item.type === 'file' ? 'item-title item-title--file' : 'item-title'">
                  {{ item.type === 'text' ? (item.title || '无标题') : (item.fileName || '无文件名') }}
                </div>
                
                <!-- 右侧：收藏 -->
                <div class="item-meta">
                  <!-- 收藏按钮 -->
                  <button
                    class="favorite-btn"
                    :class="item.isFavorite ? 'favorite-btn--active' : 'favorite-btn--inactive'"
                    :title="item.isFavorite ? '取消收藏' : '收藏'"
                    @click="emit('item-action', { id: item.id, action: 'favorite', type: item.type, content: item.content, fileId: item.fileId, fileName: item.fileName, isFavorite: item.isFavorite })"
                  >
                    <StarIcon class="w-4 h-4" aria-hidden="true" />
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
                <div class="item-actions-left">
                  <button
                    class="action-btn"
                    :class="item.type === 'text' ? 'action-btn--text' : 'action-btn--file'"
                    @click="emit('item-action', { id: item.id, action: item.type === 'text' ? 'copy' : 'download', type: item.type, content: item.content, fileId: item.fileId, fileName: item.fileName, isFavorite: item.isFavorite })"
                  >
                    <component :is="item.type === 'text' ? CopyIcon : DownloadIcon" class="action-btn-icon" />
                    {{ item.type === 'text' ? '复制' : '下载' }}
                  </button>
                  <span v-if="item.type === 'file' && item.fileSize" class="file-sz">{{ formatBytes(item.fileSize) }}</span>
                </div>

                <!-- 右侧：时间 + 删除 -->
                <div class="footer-meta">
                  <span class="timestamp">{{ formatItemTime(item.createdAt) }}</span>
                  <button
                    v-if="!item.isFavorite"
                    class="delete-btn"
                    title="删除"
                    @click="emit('item-action', { id: item.id, action: 'delete', type: item.type, content: item.content, fileId: item.fileId, fileName: item.fileName, isFavorite: item.isFavorite })"
                  >
                    <DeleteIcon class="delete-btn-icon" />
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <p v-if="!props.loading && visibleItems.length === 0" id="items-empty" class="items-empty-state">
        <InboxEmptyIcon class="items-empty-icon" />
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.item-text-content {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.file-sz {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  opacity: 0.5;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
