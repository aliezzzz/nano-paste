<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref } from "vue";
import { formatBytes } from "../../utils/format";
import { isImageFile } from "../../utils/item-icons";
import type { ItemView, ItemActionPayload } from "../../types/workspace";
import ClockIcon from "../../assets/icons/clock.svg";
import RefreshIcon from "../../assets/icons/refresh.svg";
import StarIcon from "../../assets/icons/star.svg";
import CopyIcon from "../../assets/icons/copy.svg";
import DownloadIcon from "../../assets/icons/download.svg";
import DeleteIcon from "../../assets/icons/delete.svg";
import InboxEmptyIcon from "../../assets/icons/inbox-empty.svg";
import TopicBadge from "./TopicBadge.vue";
import type { TopicInfo } from "./TopicList.vue";

export type { ItemView };

const props = withDefaults(defineProps<{
  items?: ItemView[];
  loading?: boolean;
  topics?: TopicInfo[];
  activeTopic?: string;
  mode?: "all" | "favorites";
}>(), {
  items: () => [],
  loading: false,
  topics: () => [],
  activeTopic: "",
  mode: "all",
});

const emit = defineEmits<{
  (e: "item-action", payload: ItemActionPayload): void;
  (e: "refresh-items"): void;
  (e: "select-topic", topic: string): void;
}>();

const searchQuery = ref("");
const rotating = ref(false);
const topicFilterOpen = ref(false);
const topicFilterRef = ref<HTMLElement | null>(null);
let rotateTimer: number | null = null;

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const shouldShowFavoritesOnly = props.mode === "favorites";
  const source = shouldShowFavoritesOnly ? props.items.filter((item) => item.isFavorite) : props.items;
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
const hasVisibleItems = computed(() => filteredItems.value.length > 0);
const isFavoritesMode = computed(() => props.mode === "favorites");
const activeTopicLabel = computed(() => props.activeTopic || "全部");
const hasTopics = computed(() => props.topics.length > 0);

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

function selectTopic(topic: string): void {
  emit("select-topic", topic);
  topicFilterOpen.value = false;
}

function toggleTopicFilter(): void {
  topicFilterOpen.value = !topicFilterOpen.value;
}

function closeTopicFilter(event: MouseEvent): void {
  if (topicFilterRef.value && !topicFilterRef.value.contains(event.target as Node)) {
    topicFilterOpen.value = false;
  }
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
    title: displayTitle(item),
    language: item.language,
  };
}

function displayTitle(item: ItemView): string {
  if (item.type === "file") return item.fileName || "无文件名";
  return item.title?.trim() || item.content?.trim() || "空文本";
}

function isCodeItem(item: ItemView): boolean {
  return item.type === "text" && item.contentKind === "code";
}

function primaryAction(item: ItemView): ItemActionPayload["action"] {
  if (isCodeItem(item)) return "preview-code";
  if (item.type === "text") return "copy";
  if (item.type === "file" && item.fileName && isImageFile(item.fileName)) return "preview";
  return "download";
}

function actionLabel(item: ItemView): string {
  const action = primaryAction(item);
  if (action === "copy") return "复制";
  if (action === "preview-code") return "预览代码";
  if (action === "preview") return "预览";
  return "下载";
}

function actionIcon(item: ItemView) {
  const action = primaryAction(item);
  if (action === "download" || action === "preview") return DownloadIcon;
  return CopyIcon;
}

function updateItemTopic(item: ItemView, topic: string): void {
  emit("item-action", {
    id: item.id,
    action: "set-topic",
    type: item.type,
    content: item.content,
    fileId: item.fileId,
    fileName: item.fileName,
    isFavorite: item.isFavorite,
    topic,
  });
}

onMounted(() => {
  document.addEventListener("click", closeTopicFilter);
});

onUnmounted(() => {
  document.removeEventListener("click", closeTopicFilter);
});

onBeforeUnmount(() => {
  if (rotateTimer !== null) {
    window.clearTimeout(rotateTimer);
    rotateTimer = null;
  }
});
</script>

<template>
  <div class="items-panel">
    <div class="items-title-row">
      <h2 class="panel-title">
        <ClockIcon class="panel-title-icon" />
        {{ isFavoritesMode ? '我的收藏' : '内容中转台' }}
      </h2>
    </div>
    <div class="items-toolbar-row">
      <label class="items-search-wrap">
        <input
          v-model="searchQuery"
          data-testid="items-search"
          class="items-search"
          type="search"
          placeholder="搜索文本、文件名或标签"
        >
      </label>
      <div v-if="hasTopics" ref="topicFilterRef" class="topic-filter-dropdown">
        <button
          type="button"
          data-testid="topic-filter-toggle"
          class="topic-filter-btn"
          :class="topicFilterOpen ? 'topic-filter-btn--open' : ''"
          @click="toggleTopicFilter"
        >
          <span>{{ activeTopicLabel }}</span>
          <span class="topic-filter-arrow">{{ topicFilterOpen ? '▴' : '▾' }}</span>
        </button>
        <div v-if="topicFilterOpen" data-testid="topic-filter-menu" class="topic-filter-menu custom-scrollbar">
          <button
            type="button"
            class="topic-chip"
            :class="props.activeTopic === '' ? 'topic-chip--active' : ''"
            @click="selectTopic('')"
          >
            全部
          </button>
          <button
            v-for="topic in props.topics"
            :key="topic.name"
            type="button"
            class="topic-chip"
            :class="props.activeTopic === topic.name ? 'topic-chip--active' : ''"
            @click="selectTopic(topic.name)"
          >
            <span>{{ topic.name }}</span>
            <span class="topic-chip-count">{{ topic.count }}</span>
          </button>
        </div>
      </div>
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
    </div>

    <p id="items-loading" class="loading-text" :class="props.loading ? '' : 'hidden'">加载中...</p>

    <div class="list-container">
      <div v-if="hasVisibleItems" id="items-list" class="items-list custom-scrollbar">
        <section v-if="isFavoritesMode" data-testid="mobile-favorites-section" class="items-section">
          <div v-if="favoriteItems.length === 0" class="items-section-empty">还没有收藏内容</div>
          <article v-for="item in favoriteItems" :key="item.id" class="item-card group item-card--favorite">
            <div class="item-main">
              <div class="item-icon" v-html="item.iconSvg"></div>
              <div class="item-body">
                <div class="item-header">
                  <div :class="item.type === 'file' ? 'item-title item-title--file' : 'item-title'">{{ displayTitle(item) }}</div>
                  <button class="favorite-btn favorite-btn--active" title="取消收藏" @click="emit('item-action', itemPayload(item, 'favorite'))">
                    <StarIcon class="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <p v-if="item.type === 'text'" class="item-text-content">{{ item.content || '无内容' }}</p>
              </div>
            </div>
            <div class="item-footer">
              <div class="item-actions-left">
                <TopicBadge :topic="item.topic" :tags="item.tags" @update-topic="updateItemTopic(item, $event)" />
                <button v-if="isCodeItem(item)" class="action-btn action-btn--text" @click="emit('item-action', itemPayload(item, 'copy'))">
                  <CopyIcon class="action-btn-icon" />
                  复制
                </button>
                <button class="action-btn" :class="item.type === 'text' ? 'action-btn--text' : 'action-btn--file'" @click="emit('item-action', itemPayload(item, primaryAction(item)))">
                  <component :is="actionIcon(item)" class="action-btn-icon" />
                  {{ actionLabel(item) }}
                </button>
                <span v-if="item.type === 'file' && item.fileSize" class="file-sz">{{ formatBytes(item.fileSize) }}</span>
              </div>
              <span class="timestamp">{{ formatItemTime(item.createdAt) }}</span>
            </div>
          </article>
        </section>

        <section v-if="!isFavoritesMode" data-testid="all-section" class="items-section">
          <article v-for="item in filteredItems" :key="item.id" class="item-card group" :class="item.isFavorite ? 'item-card--favorite' : ''">
            <div class="item-main">
              <div class="item-icon" v-html="item.iconSvg"></div>
              <div class="item-body">
                <div class="item-header">
                  <div :class="item.type === 'file' ? 'item-title item-title--file' : 'item-title'">{{ displayTitle(item) }}</div>
                  <button class="favorite-btn" :class="item.isFavorite ? 'favorite-btn--active' : 'favorite-btn--inactive'" :title="item.isFavorite ? '取消收藏' : '收藏'" @click="emit('item-action', itemPayload(item, 'favorite'))">
                    <StarIcon class="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <p v-if="item.type === 'text'" class="item-text-content">{{ item.content || '无内容' }}</p>
              </div>
            </div>
            <div class="item-footer">
              <div class="item-actions-left">
                <TopicBadge :topic="item.topic" :tags="item.tags" @update-topic="updateItemTopic(item, $event)" />
                <button v-if="isCodeItem(item)" class="action-btn action-btn--text" @click="emit('item-action', itemPayload(item, 'copy'))">
                  <CopyIcon class="action-btn-icon" />
                  复制
                </button>
                <button class="action-btn" :class="item.type === 'text' ? 'action-btn--text' : 'action-btn--file'" @click="emit('item-action', itemPayload(item, primaryAction(item)))">
                  <component :is="actionIcon(item)" class="action-btn-icon" />
                  {{ actionLabel(item) }}
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
          </article>
        </section>
      </div>

      <div v-if="!props.loading && !hasVisibleItems" id="items-empty" class="items-empty-state">
        <InboxEmptyIcon class="items-empty-icon" />
        <strong>从这里开始</strong>
        <span>{{ searchQuery ? '没有匹配的内容，换个关键词试试' : (isFavoritesMode ? '收藏常用内容后会出现在这里' : '粘贴文本、拖拽文件，或用浏览器右键菜单发送到 NanoPaste') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.items-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 0;
}

.items-title-row {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.items-toolbar-row {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.refresh-icon--rotating {
  animation: refresh-spin-once 620ms ease-in-out 1;
}

.loading-text {
  flex: 0 0 auto;
  margin: 0;
}

.hidden {
  display: none;
}

@keyframes refresh-spin-once {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.topic-filter-dropdown {
  position: relative;
  flex: 0 0 auto;
}

.topic-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  max-width: 140px;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  background: var(--bg-card);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  padding: 0 10px;
  white-space: nowrap;
  overflow: hidden;
}

.topic-filter-btn span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
}

.topic-filter-btn:hover {
  border-color: var(--border-strong);
  color: var(--text-main);
}

.topic-filter-btn--open {
  border-color: rgba(var(--accent-rgb), 0.35);
  color: var(--text-accent);
}

.topic-filter-arrow {
  flex: 0 0 auto;
  font-size: 10px;
  opacity: 0.7;
}

.topic-filter-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 50;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 280px;
  padding: 10px;
  border: 1px solid var(--border-strong);
  border-radius: 14px;
  background: var(--bg-card);
  box-shadow: var(--shadow-md);
  max-height: 280px;
  overflow-y: auto;
}

.items-search-wrap {
  display: block;
  flex: 1;
  min-width: 0;
}

.items-search {
  width: 100%;
  height: 36px;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  background: var(--input-bg);
  color: var(--text-main);
  padding: 0 12px;
  outline: none;
  font-size: 13px;
}

.items-search:focus {
  border-color: var(--text-accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.items-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}

.items-section + .items-section {
  margin-top: 16px;
}

.items-section-empty {
  grid-column: 1 / -1;
  border: 1px dashed var(--border-subtle);
  border-radius: 18px;
  color: var(--text-muted);
  font-size: 12px;
  padding: 10px 12px;
}

.item-card {
  display: flex;
  flex-direction: column;
  min-height: 130px;
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  background: var(--bg-card);
  padding: 12px;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.item-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.item-main {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
}

.item-icon {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: rgba(var(--accent-rgb), 0.08);
  color: var(--text-accent);
}

.item-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.item-body {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-body :deep(.meta-tags) {
  margin-top: 0;
  gap: 4px;
}

.item-body :deep(.meta-topic),
.item-body :deep(.meta-tag) {
  font-size: 10px;
  padding: 2px 7px;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-title {
  min-width: 0;
  overflow: hidden;
  color: var(--text-main);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-title--file {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: 0 0 auto;
  margin-top: 8px;
}

.footer-meta,
.item-actions-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.favorite-btn {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  color: var(--text-muted);
}

.favorite-btn--active {
  color: var(--text-accent);
  background: rgba(var(--accent-rgb), 0.1);
}

.action-btn,
.delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
}

.action-btn {
  background: rgba(var(--accent-rgb), 0.1);
  color: var(--text-accent);
}

.delete-btn {
  color: var(--text-muted);
}

.action-btn-icon,
.delete-btn-icon {
  width: 13px;
  height: 13px;
}

.timestamp {
  color: var(--text-muted);
  font-size: 11px;
  white-space: nowrap;
}

.list-container {
  flex: 1 1 auto;
  min-height: 0;
}

.items-list {
  height: 100%;
}

.item-card--favorite {
  background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.08), var(--bg-card) 50%);
  border-left: 3px solid var(--text-accent);
}

.item-text-content {
  display: -webkit-box;
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.items-empty-state {
  display: grid;
  justify-items: center;
  gap: 8px;
  border: 1px dashed var(--border-subtle);
  border-radius: 24px;
  color: var(--text-muted);
  padding: 22px 16px;
  text-align: center;
  height: 100%;
  align-content: center;
}

.items-empty-state strong {
  color: var(--text-primary);
  font-size: 16px;
}

.file-sz {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  opacity: 0.7;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

@media (max-width: 720px) {
  .items-panel {
    padding: 0 10px;
  }

  .items-section {
    grid-template-columns: 1fr;
  }

  .item-title {
    white-space: normal;
    word-break: break-all;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .topic-filter-btn {
    max-width: 100px;
  }

  .items-toolbar-row {
    flex-wrap: wrap;
  }
}
</style>
