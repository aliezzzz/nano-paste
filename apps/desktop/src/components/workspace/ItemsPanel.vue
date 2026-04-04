<script setup lang="ts">
import { computed, ref } from "vue";

export interface ItemView {
  id: string;
  type: "text" | "file";
  title?: string;
  content?: string;
  fileName?: string;
  isFavorite: boolean;
  createdAt: string;
  iconSvg: string;
}

const props = withDefaults(defineProps<{ items?: ItemView[]; loading?: boolean }>(), {
  items: () => [],
  loading: false,
});

const emit = defineEmits<{
  (e: "item-action", payload: { id: string; action: "copy" | "download" | "delete" | "favorite"; content?: string }): void;
}>();

function actionFor(item: ItemView): "copy" | "download" {
  return item.type === "text" ? "copy" : "download";
}

const favoriteOnly = ref(false);
const visibleItems = computed(() => {
  if (!favoriteOnly.value) {
    return props.items;
  }
  return props.items.filter((item) => item.isFavorite);
});
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 p-4 sm:p-5">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <svg class="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        最近条目
      </h2>
      <div class="inline-flex rounded-lg border border-slate-700/60 bg-slate-900/70 p-0.5">
        <button
          type="button"
          class="px-2.5 py-1 text-xs rounded-md transition-colors"
          :class="!favoriteOnly ? 'text-white bg-slate-700/90' : 'text-slate-300 hover:text-white'"
          @click="favoriteOnly = false"
        >
          全部
        </button>
        <button
          type="button"
          class="px-2.5 py-1 text-xs rounded-md transition-colors"
          :class="favoriteOnly ? 'text-amber-200 bg-amber-500/20' : 'text-slate-300 hover:text-amber-200'"
          @click="favoriteOnly = true"
        >
          仅收藏
        </button>
      </div>
    </div>

    <p id="items-loading" class="text-sm text-slate-400" :class="props.loading ? '' : 'hidden'">加载中...</p>
    <div class="relative flex-1 min-h-0">
      <div id="items-list" class="h-full overflow-y-auto custom-scrollbar space-y-3">
        <div v-for="item in visibleItems" :key="item.id" class="bg-slate-900/85 border border-slate-700/50 rounded-lg p-4 hover:border-violet-500/30 transition-all group">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-slate-800/70 flex items-center justify-center shrink-0" v-html="item.iconSvg"></div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-medium text-white truncate">{{ item.title || '未命名' }}</h3>
                <span class="px-2 py-0.5 text-xs rounded-full border" :class="item.type === 'text' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'">
                  {{ item.type === 'text' ? '文本' : '文件' }}
                </span>
              </div>
              <p class="text-sm text-slate-400 truncate">{{ item.type === 'text' ? (item.content || '无内容') : (item.fileName || '无文件名') }}</p>
              <p class="text-xs text-slate-500 mt-1">{{ new Date(item.createdAt).toLocaleString('zh-CN') }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <button
                class="w-10 h-10 rounded-lg transition-all flex items-center justify-center"
                :class="item.isFavorite ? 'text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40' : 'text-slate-400 bg-slate-800/45 hover:text-amber-300 hover:bg-amber-500/10 border border-slate-700/50'"
                :title="item.isFavorite ? '取消收藏' : '收藏'"
                @click="emit('item-action', { id: item.id, action: 'favorite' })"
              >
                <svg class="w-5 h-5" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M533.504 268.288q33.792-41.984 71.68-75.776 32.768-27.648 74.24-50.176t86.528-19.456q63.488 5.12 105.984 30.208t67.584 63.488 34.304 87.04 6.144 99.84-17.92 97.792-36.864 87.04-48.64 74.752-53.248 61.952q-40.96 41.984-85.504 78.336t-84.992 62.464-73.728 41.472-51.712 15.36q-20.48 1.024-52.224-14.336t-69.632-41.472-79.872-61.952-82.944-75.776q-26.624-25.6-57.344-59.392t-57.856-74.24-46.592-87.552-21.504-100.352 11.264-99.84 39.936-83.456 65.536-61.952 88.064-35.328q24.576-5.12 49.152-1.536t48.128 12.288 45.056 22.016 40.96 27.648q45.056 33.792 86.016 80.896z" fill="currentColor"></path>
                </svg>
              </button>
              <button class="w-10 h-10 rounded-lg text-white transition-all flex items-center justify-center" :class="item.type === 'text' ? 'bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/30' : 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-500/30'" :title="item.type === 'text' ? '复制' : '下载'" @click="emit('item-action', item.type === 'text' ? { id: item.id, action: 'copy', content: item.content ?? '' } : { id: item.id, action: 'download' })">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="item.type === 'text'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
              </button>
              <button class="w-10 h-10 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100" title="删除" @click="emit('item-action', { id: item.id, action: 'delete' })">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <p v-if="!props.loading && visibleItems.length === 0" id="items-empty" class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-500">
        <svg class="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
        </svg>
        {{ favoriteOnly ? '暂无收藏条目' : '暂无条目' }}
      </p>
    </div>
  </div>
</template>
