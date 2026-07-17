<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, type Component } from "vue";
import { highlightCode } from "../../utils/code-highlight";
import { formatBytes } from "../../utils/format";
import { isImageFile } from "../../utils/item-icons";
import type { ItemView, ItemActionPayload } from "../../types/workspace";
import RefreshIcon from "../../assets/icons/refresh.svg";
import HeartIcon from "../../assets/icons/heart.svg";
import CopyIcon from "../../assets/icons/copy.svg";
import DownloadIcon from "../../assets/icons/download.svg";
import CodeIcon from "../../assets/icons/code.svg";
import DeleteIcon from "../../assets/icons/delete.svg";
import InboxEmptyIcon from "../../assets/icons/inbox-empty.svg";
import GridIcon from "../../assets/icons/grid.svg";
import TextIcon from "../../assets/icons/text.svg";
import FileIcon from "../../assets/icons/folder.svg";
import ImageIcon from "../../assets/icons/image.svg";
import TopicBadge from "./TopicBadge.vue";
import DropdownSelect from "./DropdownSelect.vue";
import type { TopicOption } from "./TopicSelect.vue";
import type { TopicInfo } from "./TopicList.vue";
import { MasonryWall } from "@yeger/vue-masonry-wall";

export type { ItemView };

type CategoryKey = "all" | "text" | "code" | "file" | "image" | "favorite";

interface CategoryDef {
  key: CategoryKey;
  label: string;
  icon: Component;
}

const categories: CategoryDef[] = [
  { key: "all", label: "全部", icon: GridIcon },
  { key: "text", label: "文本", icon: TextIcon },
  { key: "code", label: "代码", icon: CodeIcon },
  { key: "file", label: "文件", icon: FileIcon },
  { key: "image", label: "图片", icon: ImageIcon },
  { key: "favorite", label: "收藏", icon: HeartIcon },
];

const props = withDefaults(
  defineProps<{
    items?: ItemView[];
    loading?: boolean;
    topics?: TopicInfo[];
    activeTopic?: string;
    mode?: "all" | "favorites";
    searchQuery?: string;
    hideFavoriteCategory?: boolean;
  }>(),
  {
    items: () => [],
    loading: false,
    topics: () => [],
    activeTopic: "",
    mode: "all",
    searchQuery: "",
    hideFavoriteCategory: false,
  },
);

const emit = defineEmits<{
  (e: "item-action", payload: ItemActionPayload): void;
  (e: "refresh-items"): void;
  (e: "select-topic", topic: string): void;
  (e: "update:search-query", value: string): void;
}>();

const searchQuery = ref(props.searchQuery);
const rotating = ref(false);
const editingTopicItemId = ref<string | null>(null);
const activeCategory = ref<CategoryKey>("all");
let rotateTimer: number | null = null;

watch(
  () => props.searchQuery,
  (value) => {
    if (value !== searchQuery.value) {
      searchQuery.value = value;
    }
  },
);

watch(searchQuery, (value) => {
  emit("update:search-query", value);
});

const modeItems = computed(() => {
  const shouldShowFavoritesOnly = props.mode === "favorites";
  return shouldShowFavoritesOnly
    ? props.items.filter((item) => item.isFavorite)
    : props.items;
});

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const source = modeItems.value.filter((item) =>
    matchesCategory(item, activeCategory.value),
  );
  if (!query) return source;

  return source.filter((item) => {
    const searchable = [
      item.title,
      item.content,
      item.fileName,
      item.type,
      ...(item.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return searchable.includes(query);
  });
});

const favoriteItems = computed(() =>
  filteredItems.value.filter((item) => item.isFavorite),
);
const displayItems = computed(() =>
  isFavoritesMode.value ? favoriteItems.value : filteredItems.value,
);
const hasVisibleItems = computed(() => filteredItems.value.length > 0);
const isFavoritesMode = computed(() => props.mode === "favorites");
const hasTopics = computed(() => props.topics.length > 0);
const topicFilterOptions = computed(() => [
  { label: "全部", value: "", count: props.items.length },
  ...props.topics.map((t) => ({
    label: t.name,
    value: t.name,
    count: t.count,
  })),
]);
const topicOptionsForBadge = computed<TopicOption[]>(() =>
  props.topics.map((t) => ({ name: t.name, count: t.count })),
);
const categoryCounts = computed(() => {
  const counts: Record<CategoryKey, number> = {
    all: modeItems.value.length,
    text: 0,
    code: 0,
    file: 0,
    image: 0,
    favorite: 0,
  };
  for (const item of modeItems.value) {
    if (item.isFavorite) counts.favorite += 1;
    if (isCodeItem(item)) {
      counts.code += 1;
    } else if (item.type === "text") {
      counts.text += 1;
    } else if (item.type === "file") {
      counts.file += 1;
      if (item.fileName && isImageFile(item.fileName)) counts.image += 1;
    }
  }
  return counts;
});

const visibleCategories = computed<CategoryDef[]>(() =>
  categories.filter((c) => {
    if (props.hideFavoriteCategory && c.key === "favorite") return false;
    return c.key === "all" || categoryCounts.value[c.key] > 0;
  }),
);

watch(visibleCategories, (list) => {
  if (!list.some((c) => c.key === activeCategory.value)) {
    activeCategory.value = "all";
  }
});

function matchesCategory(item: ItemView, category: CategoryKey): boolean {
  if (category === "all") return true;
  if (category === "favorite") return item.isFavorite;
  if (category === "code") return isCodeItem(item);
  if (category === "text") return item.type === "text" && !isCodeItem(item);
  if (category === "image")
    return (
      item.type === "file" &&
      Boolean(item.fileName && isImageFile(item.fileName))
    );
  return item.type === "file";
}

function selectCategory(category: CategoryKey): void {
  activeCategory.value = category;
}

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
}

function formatItemTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "昨天";
  if (days < 7) return `${days} 天前`;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

function itemPayload(
  item: ItemView,
  action: ItemActionPayload["action"],
): ItemActionPayload {
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
  if (isCodeItem(item)) return item.title?.trim() || "未命名代码片段";
  return item.title?.trim() || "未命名文本";
}

function isCodeItem(item: ItemView): boolean {
  return item.type === "text" && item.contentKind === "code";
}

function typeIconClass(item: ItemView): string {
  if (isCodeItem(item)) return "type-code";
  if (item.type === "file" && item.fileName && isImageFile(item.fileName))
    return "type-image";
  if (item.type === "file") return "type-file";
  return "type-text";
}

function itemKindLabel(item: ItemView): string {
  if (isCodeItem(item)) return "代码";
  if (item.type === "file" && item.fileName && isImageFile(item.fileName))
    return "图片";
  if (item.type === "file") return "文件";
  return "文本";
}

function primaryAction(item: ItemView): ItemActionPayload["action"] {
  if (isCodeItem(item)) return "preview-code";
  if (item.type === "text") return "copy";
  if (item.type === "file" && item.fileName && isImageFile(item.fileName))
    return "preview";
  return "download";
}

function actionLabel(item: ItemView): string {
  const action = primaryAction(item);
  if (action === "copy") return "复制";
  if (action === "preview-code") return "预览";
  if (action === "preview") return "预览";
  return "下载";
}

function actionIcon(item: ItemView) {
  const action = primaryAction(item);
  if (action === "download" || action === "preview") return DownloadIcon;
  if (action === "preview-code") return CodeIcon;
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

function onImageError(event: Event): void {
  (event.target as HTMLImageElement).style.display = "none";
}

function itemIconStyle(item: ItemView): Record<string, string> | undefined {
  if (!item.iconBackground && !item.iconDarkBackground) return undefined;

  const style: Record<string, string> = {};
  if (item.iconBackground) {
    style["--item-icon-bg"] = item.iconBackground;
  }
  if (item.iconDarkBackground) {
    style["--item-icon-bg-dark"] = item.iconDarkBackground;
  }
  return style;
}

function itemCardStyle(item: ItemView): Record<string, string> | undefined {
  if (!item.cardBackground) return undefined;
  return { "--item-card-bg": item.cardBackground };
}

function startTopicEdit(itemId: string): void {
  editingTopicItemId.value = itemId;
}

function endTopicEdit(itemId: string): void {
  if (editingTopicItemId.value === itemId) {
    editingTopicItemId.value = null;
  }
}

function isTopicEditing(itemId: string): boolean {
  return editingTopicItemId.value === itemId;
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
    <div class="items-shell-head">
      <div class="items-toolbar-row">
        <div class="category-tabs" aria-label="内容类型筛选">
          <button
            v-for="category in visibleCategories"
            :key="category.key"
            type="button"
            class="category-tab"
            :class="
              activeCategory === category.key ? 'category-tab--active' : ''
            "
            @click="selectCategory(category.key)"
          >
            <span class="category-tab-icon">
              <component :is="category.icon" />
            </span>
            {{ category.label }}
            <span
              v-if="categoryCounts[category.key] > 0"
              class="category-tab-count"
            >
              {{ categoryCounts[category.key] }}
            </span>
          </button>
        </div>

        <DropdownSelect
          v-if="hasTopics"
          :model-value="props.activeTopic"
          :options="topicFilterOptions"
          compact
          test-id="topic-filter-toggle"
          menu-test-id="topic-filter-menu"
          class="topic-filter-dropdown"
          @update:model-value="selectTopic"
        />

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
    </div>

    <div v-if="props.loading" class="items-skeleton" aria-label="加载中">
      <div v-for="n in 4" :key="n" class="skeleton-card">
        <div class="skeleton-line skeleton-line--title"></div>
        <div class="skeleton-line skeleton-line--body"></div>
        <div class="skeleton-line skeleton-line--body"></div>
        <div class="skeleton-line skeleton-line--footer"></div>
      </div>
    </div>

    <div class="list-container">
      <MasonryWall
        v-if="hasVisibleItems"
        :items="displayItems"
        :column-width="280"
        :gap="12"
        :min-columns="1"
        :max-columns="4"
        :key-mapper="(_item: ItemView, _col: number, _row: number, index: number) => String(_item.id)"
        class="items-list"
      >
        <template #default="{ item }">
          <article
            class="item-card"
            :class="[
              (isFavoritesMode || item.isFavorite) ? 'item-card--favorite' : '',
              item.type === 'file' ? 'item-card--file' : 'item-card--text',
            ]"
            :style="itemCardStyle(item)"
          >
            <div class="card-head">
              <div class="card-ident">
                <div
                  class="item-icon"
                  :class="typeIconClass(item)"
                  :style="itemIconStyle(item)"
                  v-html="item.iconSvg"
                ></div>
                <div class="card-titles">
                  <div class="item-title">{{ displayTitle(item) }}</div>
                  <div class="item-kind">{{ itemKindLabel(item) }}</div>
                </div>
              </div>
              <button
                class="favorite-btn"
                :class="
                  (isFavoritesMode || item.isFavorite)
                    ? 'favorite-btn--active'
                    : 'favorite-btn--inactive'
                "
                :title="(isFavoritesMode || item.isFavorite) ? '取消收藏' : '收藏'"
                @click="emit('item-action', itemPayload(item, 'favorite'))"
              >
                <HeartIcon class="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <pre
              v-if="isCodeItem(item)"
              class="code-block"
            ><code v-html="highlightCode(item.content ?? '', item.language ?? '').html"></code></pre>
            <img
              v-else-if="item.imageUrl"
              class="image-preview"
              :src="item.imageUrl"
              :alt="item.fileName || ''"
              loading="lazy"
              @click="emit('item-action', itemPayload(item, 'preview'))"
              @error="onImageError"
            />
            <div v-else-if="item.type === 'file'" class="file-line">
              <span>{{ formatBytes(item.fileSize ?? 0) }}</span>
              <span class="file-line-hint">可下载</span>
            </div>
            <div v-else-if="item.content" class="item-content-text">
              {{ item.content }}
            </div>

            <div
              class="item-footer"
              :class="
                isTopicEditing(item.id) ? 'item-footer--topic-editing' : ''
              "
            >
              <div class="item-actions-left">
                <TopicBadge
                  :topic="item.topic"
                  :tags="item.tags"
                  :topics="topicOptionsForBadge"
                  @edit-start="startTopicEdit(item.id)"
                  @edit-end="endTopicEdit(item.id)"
                  @update-topic="updateItemTopic(item, $event)"
                />
                <button
                  v-if="isCodeItem(item) && !isTopicEditing(item.id)"
                  class="action-btn action-btn--text"
                  @click="emit('item-action', itemPayload(item, 'copy'))"
                >
                  <CopyIcon class="action-btn-icon" />
                  复制
                </button>
                <button
                  v-if="!isTopicEditing(item.id)"
                  class="action-btn"
                  :class="
                    item.type === 'text'
                      ? 'action-btn--text'
                      : 'action-btn--file'
                  "
                  @click="
                    emit('item-action', itemPayload(item, primaryAction(item)))
                  "
                >
                  <component :is="actionIcon(item)" class="action-btn-icon" />
                  {{ actionLabel(item) }}
                </button>
                <span
                  v-if="
                    item.type === 'file' &&
                    item.fileSize &&
                    !isTopicEditing(item.id)
                  "
                  class="file-sz"
                  >{{ formatBytes(item.fileSize) }}</span
                >
              </div>
              <div
                v-if="!isFavoritesMode && !isTopicEditing(item.id)"
                class="footer-meta"
              >
                <span class="timestamp">{{
                  formatItemTime(item.createdAt)
                }}</span>
                <button
                  class="delete-btn"
                  title="删除"
                  @click="emit('item-action', itemPayload(item, 'delete'))"
                >
                  <DeleteIcon class="delete-btn-icon" />
                  删除
                </button>
              </div>
              <span
                v-if="isFavoritesMode && !isTopicEditing(item.id)"
                class="timestamp"
                >{{ formatItemTime(item.createdAt) }}</span
              >
            </div>
          </article>
        </template>
      </MasonryWall>

      <div
        v-if="!props.loading && !hasVisibleItems"
        id="items-empty"
        class="items-empty-state"
      >
        <InboxEmptyIcon class="items-empty-icon" />
        <strong>从这里开始</strong>
        <span>{{
          searchQuery
            ? "没有匹配的内容，换个关键词试试"
            : isFavoritesMode
              ? "收藏常用内容后会出现在这里"
              : "粘贴文本、拖拽文件，或用浏览器右键菜单发送到 NanoPaste"
        }}</span>
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
  border-radius: var(--radius-card);
}

@media (min-width: 769px) {
  .items-panel {
    padding: 12px;
    margin: 12px 0;
    background-color: var(--bg-card);
  }

  .dark .items-panel {
    background: linear-gradient(180deg, rgba(37, 42, 65, 0.74), rgba(30, 35, 56, 0.72));
    border: 1px solid rgba(195, 202, 238, 0.1);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.035),
      0 20px 52px rgba(5, 8, 18, 0.18);
  }
}

.items-shell-head {
  flex: 0 0 auto;
  background: var(--bg-glass);
}

.dark .items-shell-head {
  background: transparent;
}

.items-toolbar-row {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 0;
}

.category-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
  padding: 0 12px;
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.category-tab:hover {
  color: var(--text-main);
  background: var(--input-bg);
}

.dark .category-tab {
  color: rgba(244, 242, 255, 0.72);
}

.dark .category-tab:hover {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.045);
}

.category-tab--active {
  color: #211b11;
  background: linear-gradient(135deg, #ffe16f, var(--accent-warm));
  box-shadow: 0 8px 24px var(--accent-warm-soft);
}

.dark .category-tab--active {
  color: #211b11;
  background: linear-gradient(135deg, #ffe16f, var(--accent-warm));
  box-shadow: 0 12px 30px rgba(244, 200, 95, 0.24);
}

.category-tab-icon {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  flex: none;
}

.category-tab-icon :deep(svg) {
  width: 14px;
  height: 14px;
}

.category-tab:not(.category-tab--active) .category-tab-icon {
  color: var(--text-accent);
}

.dark .category-tab:not(.category-tab--active) .category-tab-icon {
  color: #b7a0ff;
}

.category-tab-count {
  color: inherit;
  opacity: 0.72;
}

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

.topic-filter-dropdown {
  flex: 0 0 148px;
  width: 148px;
}

.refresh-btn {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-control);
  border: 1px solid var(--border-soft);
  background: var(--bg-card);
  display: grid;
  place-items: center;
  color: var(--text-accent);
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease;
}

.dark .refresh-btn {
  border-color: rgba(196, 202, 236, 0.16);
  background: rgba(27, 31, 50, 0.74);
  color: var(--accent-warm);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
}

.refresh-btn:hover {
  border-color: var(--border-strong);
}

.refresh-btn--loading {
  color: var(--text-muted);
  cursor: not-allowed;
}

.refresh-icon {
  width: 16px;
  height: 16px;
}

.items-section-empty {
  display: block;
  border: 1px dashed var(--border-soft);
  border-radius: var(--radius-card);
  color: var(--text-muted);
  font-size: 12px;
  padding: 10px 12px;
}

/* ── 卡片 ── */
.item-card {
  display: block;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-card);
  background: var(--item-card-bg, var(--bg-card));
  padding: 14px;
  box-shadow: none;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.dark .item-card {
  border-color: rgba(196, 202, 236, 0.13);
  background: var(--item-card-bg, linear-gradient(180deg, rgba(36, 41, 64, 0.88), rgba(28, 33, 54, 0.88)));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.035),
    0 12px 34px rgba(5, 8, 18, 0.18);
}

.item-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.dark .item-card:hover {
  border-color: rgba(202, 209, 246, 0.26);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 44px rgba(5, 8, 18, 0.34);
}

.item-card--favorite {
  background: var(--item-card-bg, var(--accent-soft));
  border-color: var(--border-soft);
}

.dark .item-card--favorite {
  background: var(--item-card-bg, linear-gradient(180deg, rgba(54, 47, 70, 0.9), rgba(35, 35, 56, 0.9)));
  border-color: rgba(244, 200, 95, 0.18);
}

/* ── 卡片头部 ── */
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 11px;
}

.card-ident {
  display: flex;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.card-titles {
  min-width: 0;
}

.item-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 15px;
  font-weight: 850;
  line-height: 1.42;
  color: var(--text-main);
  word-break: break-word;
}

.item-kind {
  margin-top: 3px;
  color: var(--text-subtle);
  font-size: 11px;
  letter-spacing: 0.2px;
}

/* ── type-icon ── */
.item-icon {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-icon);
  display: grid;
  place-items: center;
  flex: none;
  background: var(--item-icon-bg, var(--accent-soft));
}

.dark .item-icon {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.item-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.dark .item-icon {
  background: var(--item-icon-bg-dark, var(--item-icon-bg, var(--accent-soft)));
}

/* ── 卡片内容区 ── */
.code-block {
  background: var(--code-bg);
  color: var(--code-text);
  border-radius: 12px;
  padding: 13px;
  white-space: pre;
  overflow-x: auto;
  overflow-y: auto;
  max-height: 180px;
  font-size: 12.5px;
  line-height: 1.62;
  border: 1px solid var(--code-border);
  margin: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.dark .code-block {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.image-preview {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
  max-height: 150px;
  border-radius: 12px;
  margin: 0;
  background: var(--input-bg);
  cursor: pointer;
}

.dark .image-preview {
  border: 1px solid rgba(205, 211, 255, 0.08);
}

.file-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-muted);
  font-size: 13px;
}

.file-line-hint {
  flex: none;
  color: var(--text-subtle);
  font-size: 11px;
}

.item-content-text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 10;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.72;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ── 卡片 footer ── */
.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 13px;
}

.item-footer--topic-editing .item-actions-left {
  flex: 1 1 auto;
}

.footer-meta,
.item-actions-left {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  min-width: 0;
}

.item-actions-left :deep(.topic-edit) {
  width: 100%;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
  margin-top: 0;
}

.item-actions-left :deep(.meta-tags) {
  min-width: 0;
}

/* ── 收藏按钮（金色） ── */
.favorite-btn {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-control);
  display: grid;
  place-items: center;
  color: var(--text-subtle);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.favorite-btn :deep(svg) {
  width: 16px;
  height: 16px;
}

.favorite-btn--active {
  color: var(--warning);
  background: var(--warning-soft);
}

.favorite-btn--inactive:hover {
  color: var(--warning);
  background: var(--warning-soft);
}

/* ── 操作按钮 ── */
.action-btn,
.delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--radius-control);
  font-size: 11px;
  font-weight: 750;
  padding: 0 9px;
  height: 29px;
  border: 1px solid var(--border-soft);
  background: var(--bg-card);
  color: var(--text-muted);
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.dark .action-btn,
.dark .delete-btn {
  border-color: rgba(196, 202, 236, 0.13);
  background: rgba(255, 255, 255, 0.035);
}

.action-btn:hover {
  color: var(--text-accent);
  border-color: rgba(var(--accent-rgb), 0.35);
  background: var(--accent-soft);
}

.dark .action-btn:hover {
  background: rgba(var(--accent-rgb), 0.14);
}

.delete-btn {
  color: var(--danger);
  border-color: var(--border-soft);
}

.delete-btn:hover {
  color: var(--danger);
  border-color: rgba(var(--danger-rgb), 0.35);
  background: rgba(var(--danger-rgb), 0.08);
}

.action-btn-icon,
.delete-btn-icon {
  width: 13px;
  height: 13px;
}

.timestamp {
  color: var(--text-subtle);
  font-size: 11px;
  white-space: nowrap;
}

/* ── 列表容器 ── */
.list-container {
  padding-top: 12px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.items-list {
  height: 100%;
  width: 100%;
}

/* ── 空状态 ── */
.items-empty-state {
  display: grid;
  justify-items: center;
  gap: 8px;
  border: 1px dashed var(--border-soft);
  border-radius: var(--radius-card);
  color: var(--text-muted);
  padding: 22px 16px;
  text-align: center;
  height: 100%;
  align-content: center;
}

.items-empty-state strong {
  color: var(--text-main);
  font-size: 16px;
}

.items-empty-icon {
  width: 64px;
  height: 64px;
  color: var(--text-muted);
  opacity: 0.55;
}

/* ── 骨架屏 ── */
.items-skeleton {
  columns: 3 280px;
  column-gap: 12px;
}

.skeleton-card {
  break-inside: avoid;
  margin: 0 0 12px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-card);
  background: var(--bg-card);
  padding: 14px;
}

.dark .skeleton-card {
  border-color: rgba(196, 202, 236, 0.13);
  background: rgba(32, 37, 58, 0.74);
}

.skeleton-line {
  border-radius: 6px;
  background: var(--input-bg);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.skeleton-line--title {
  height: 16px;
  width: 60%;
  margin-bottom: 11px;
}

.skeleton-line--body {
  height: 12px;
  width: 100%;
  margin-bottom: 8px;
}

.skeleton-line--footer {
  height: 10px;
  width: 40%;
  margin-top: 13px;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.85;
  }
}

@media (max-width: 768px) {
  .items-panel {
    background: var(--bg-card);
    border-radius: var(--radius-card);
  }

  .items-shell-head {
    background: var(--bg-header);
    border-top: 1px solid var(--border-soft);
    padding: 6px;
    border-bottom: 1px solid var(--border-soft);
  }

  .list-container {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 8px;
  }

  .items-list {
    height: auto;
    overflow: visible;
  }

  .items-skeleton {
    columns: 1;
  }

  .items-toolbar-row {
    justify-content: space-between;
    gap: 6px;
  }

  .category-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
    flex: 1 1 auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .category-tabs::-webkit-scrollbar {
    display: none;
  }

  .category-tab {
    min-height: 30px;
    font-size: 11px;
    padding: 0 10px;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .category-tab--active {
    box-shadow: none;
  }

  .topic-filter-dropdown {
    display: none;
  }

  .items-empty-state {
    border: none;
    padding: 24px 16px;
    height: auto;
    margin: 0;
  }

  .items-empty-icon {
    width: 48px;
    height: 48px;
  }
}
</style>
