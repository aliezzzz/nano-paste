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
const searchQuery = ref("");
const selectedIds = ref<string[]>([]);
const rotating = ref(false);
let rotateTimer: number | null = null;

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const source = favoriteOnly.value ? props.items.filter((item) => item.isFavorite) : props.items;
  if (!query) return source;

  return source.filter((item) => {
    const searchable = [item.title, item.content, item.fileName, item.type, ...(item.tags ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return searchable.includes(query);
  });
});

const favoriteItems = computed(() => filteredItems.value.filter((item) => item.isFavorite));
const historyItems = computed(() => filteredItems.value.filter((item) => !item.isFavorite));
const hasVisibleItems = computed(() => favoriteItems.value.length > 0 || historyItems.value.length > 0);
const selectedItems = computed(() => props.items.filter((item) => selectedIds.value.includes(item.id)));

function refreshItems(): void {
  if (props.loading) return;

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
  if (Number.isNaN(date.getTime())) return value;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

function itemPayload(item: ItemView, action: ItemActionPayload["action"]): ItemActionPayload {
  return {
    id: item.id,
    action,
    type: item.type,
    content: item.content,
    fileId: item.fileId,
    fileName: item.fileName,
    isFavorite: item.isFavorite,
  };
}

function displayTitle(item: ItemView): string {
  if (item.type === "file") return item.fileName || "无文件名";
  return item.title || "无标题";
}

function primaryAction(item: ItemView): ItemActionPayload["action"] {
  return item.type === "text" ? "copy" : "download";
}

function sectionItems(kind: "favorite" | "history"): ItemView[] {
  return kind === "favorite" ? favoriteItems.value : historyItems.value;
}

function toggleSelection(itemID: string, checked: boolean): void {
  if (checked && !selectedIds.value.includes(itemID)) {
    selectedIds.value = [...selectedIds.value, itemID];
    return;
  }
  if (!checked) {
    selectedIds.value = selectedIds.value.filter((id) => id !== itemID);
  }
}

function runBatchDelete(): void {
  for (const item of selectedItems.value) {
    emit("item-action", itemPayload(item, "delete"));
  }
  selectedIds.value = [];
}

function runBatchUnfavorite(): void {
  for (const item of selectedItems.value.filter((item) => item.isFavorite)) {
    emit("item-action", itemPayload(item, "favorite"));
  }
  selectedIds.value = [];
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
    <div class="panel-header items-panel-topline">
      <h2 class="panel-title">
        <ClockIcon class="panel-title-icon" />
        内容中转台
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

    <div class="items-toolbar">
      <label class="items-search-wrap">
        <span class="items-search-label">快速找回</span>
        <input
          v-model="searchQuery"
          data-testid="items-search"
          class="items-search"
          type="search"
          placeholder="搜索文本、文件名或标签"
        >
      </label>
      <div class="items-summary">
        <span>{{ filteredItems.length }} 条结果</span>
        <span v-if="favoriteItems.length">{{ favoriteItems.length }} 条收藏</span>
      </div>
    </div>

    <p id="items-loading" class="loading-text" :class="props.loading ? '' : 'hidden'">加载中...</p>

    <div v-if="selectedItems.length > 0" data-testid="batch-bar" class="batch-bar">
      <span>已选 {{ selectedItems.length }} 项</span>
      <button data-testid="batch-unfavorite" type="button" class="batch-btn" @click="runBatchUnfavorite">取消收藏</button>
      <button data-testid="batch-delete" type="button" class="batch-btn batch-btn--danger" @click="runBatchDelete">批量删除</button>
    </div>

    <div class="list-container">
      <div v-if="hasVisibleItems" id="items-list" class="items-list custom-scrollbar">
        <section data-testid="favorite-section" class="items-section">
          <div class="items-section-head">
            <div>
              <h3 class="items-section-title">常用收藏</h3>
              <p class="items-section-hint">把常用文本和文件固定在最顺手的位置</p>
            </div>
            <span class="items-section-count">{{ favoriteItems.length }}</span>
          </div>
          <div v-if="favoriteItems.length === 0" class="items-section-empty">还没有收藏内容</div>
          <article v-for="item in favoriteItems" :key="item.id" class="item-card group item-card--favorite">
            <div class="item-layout">
              <input class="item-select" data-testid="item-select" type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelection(item.id, ($event.target as HTMLInputElement).checked)">
              <div class="item-icon" v-html="item.iconSvg"></div>
              <div class="item-content">
                <div class="item-header">
                  <div :class="item.type === 'file' ? 'item-title item-title--file' : 'item-title'">{{ displayTitle(item) }}</div>
                  <button class="favorite-btn favorite-btn--active" title="取消收藏" @click="emit('item-action', itemPayload(item, 'favorite'))">
                    <StarIcon class="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <p v-if="item.type === 'text'" class="item-text-content">{{ item.content || '无内容' }}</p>
                <div v-if="item.tags?.length" class="item-tags">
                  <span v-for="tag in item.tags" :key="tag" class="item-tag">#{{ tag }}</span>
                </div>
                <div class="item-footer">
                  <div class="item-actions-left">
                    <button class="action-btn" :class="item.type === 'text' ? 'action-btn--text' : 'action-btn--file'" @click="emit('item-action', itemPayload(item, primaryAction(item)))">
                      <component :is="item.type === 'text' ? CopyIcon : DownloadIcon" class="action-btn-icon" />
                      {{ item.type === 'text' ? '复制' : '下载' }}
                    </button>
                    <span v-if="item.type === 'file' && item.fileSize" class="file-sz">{{ formatBytes(item.fileSize) }}</span>
                  </div>
                  <span class="timestamp">{{ formatItemTime(item.createdAt) }}</span>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section data-testid="history-section" class="items-section">
          <div class="items-section-head">
            <div>
              <h3 class="items-section-title">全部历史</h3>
              <p class="items-section-hint">最近发送和上传的内容都会在这里</p>
            </div>
            <span class="items-section-count">{{ historyItems.length }}</span>
          </div>
          <div v-if="historyItems.length === 0" class="items-section-empty">暂无普通历史</div>
          <article v-for="item in historyItems" :key="item.id" class="item-card group">
            <div class="item-layout">
              <input class="item-select" data-testid="item-select" type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelection(item.id, ($event.target as HTMLInputElement).checked)">
              <div class="item-icon" v-html="item.iconSvg"></div>
              <div class="item-content">
                <div class="item-header">
                  <div :class="item.type === 'file' ? 'item-title item-title--file' : 'item-title'">{{ displayTitle(item) }}</div>
                  <button class="favorite-btn favorite-btn--inactive" title="收藏" @click="emit('item-action', itemPayload(item, 'favorite'))">
                    <StarIcon class="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <p v-if="item.type === 'text'" class="item-text-content">{{ item.content || '无内容' }}</p>
                <div v-if="item.tags?.length" class="item-tags">
                  <span v-for="tag in item.tags" :key="tag" class="item-tag">#{{ tag }}</span>
                </div>
                <div class="item-footer">
                  <div class="item-actions-left">
                    <button class="action-btn" :class="item.type === 'text' ? 'action-btn--text' : 'action-btn--file'" @click="emit('item-action', itemPayload(item, primaryAction(item)))">
                      <component :is="item.type === 'text' ? CopyIcon : DownloadIcon" class="action-btn-icon" />
                      {{ item.type === 'text' ? '复制' : '下载' }}
                    </button>
                    <span v-if="item.type === 'file' && item.fileSize" class="file-sz">{{ formatBytes(item.fileSize) }}</span>
                  </div>
                  <div class="footer-meta">
                    <span class="timestamp">{{ formatItemTime(item.createdAt) }}</span>
                    <button class="delete-btn" title="删除" @click="emit('item-action', itemPayload(item, 'delete'))">
                      <DeleteIcon class="delete-btn-icon" />
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>

      <div v-if="!props.loading && !hasVisibleItems" id="items-empty" class="items-empty-state">
        <InboxEmptyIcon class="items-empty-icon" />
        <strong>从这里开始</strong>
        <span>{{ searchQuery ? '没有匹配的内容，换个关键词试试' : '粘贴文本、拖拽文件，或用浏览器右键菜单发送到 NanoPaste' }}</span>
      </div>
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

.items-toolbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
  margin: 14px 0 12px;
}

.items-search-wrap {
  display: grid;
  gap: 6px;
  flex: 1;
}

.items-search-label {
  color: var(--text-muted);
  font-size: 11px;
  letter-spacing: 0.08em;
}

.items-search {
  width: 100%;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: var(--surface-raised);
  color: var(--text-primary);
  padding: 11px 14px;
  outline: none;
}

.items-search:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.items-summary {
  display: flex;
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
  white-space: nowrap;
}

.items-section {
  display: grid;
  gap: 10px;
}

.items-section + .items-section {
  margin-top: 18px;
}

.items-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
}

.items-section-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 14px;
}

.items-section-hint {
  margin: 3px 0 0;
  color: var(--text-muted);
  font-size: 11px;
}

.items-section-count {
  min-width: 28px;
  border-radius: 999px;
  background: var(--surface-raised);
  color: var(--text-muted);
  text-align: center;
  font-size: 12px;
  padding: 4px 8px;
}

.items-section-empty {
  border: 1px dashed var(--border-subtle);
  border-radius: 18px;
  color: var(--text-muted);
  font-size: 12px;
  padding: 14px;
}

.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 10px 0;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: var(--surface-raised);
  color: var(--text-primary);
  padding: 10px 12px;
  font-size: 12px;
}

.batch-btn {
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: transparent;
  color: var(--text-primary);
  padding: 6px 10px;
}

.batch-btn--danger {
  color: var(--danger);
}

.item-select {
  align-self: start;
  margin-top: 12px;
  accent-color: var(--accent);
}

.item-card--favorite {
  border-color: color-mix(in srgb, var(--accent) 36%, var(--border-subtle));
}

.item-text-content {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.item-tag {
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 11px;
  padding: 3px 8px;
}

.items-empty-state {
  display: grid;
  justify-items: center;
  gap: 8px;
  border: 1px dashed var(--border-subtle);
  border-radius: 24px;
  color: var(--text-muted);
  padding: 30px 18px;
  text-align: center;
}

.items-empty-state strong {
  color: var(--text-primary);
  font-size: 16px;
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
