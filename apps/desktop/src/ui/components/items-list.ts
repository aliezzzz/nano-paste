import type { ItemDetail } from '../../../../../packages/contracts/v1';

export function createItemsPanel(): string {
  return `
    <div class="flex-1 flex flex-col min-h-0 p-4 sm:p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <svg class="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          最近条目
        </h2>
      </div>

      <p id="items-loading" class="text-sm text-slate-400 hidden">加载中...</p>
      <div id="items-list" class="flex-1 overflow-y-auto custom-scrollbar space-y-3">
        <!-- Items will be injected here -->
      </div>
      <p id="items-empty" class="text-center py-12 text-slate-500 hidden">
        <svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
        </svg>
        暂无条目
      </p>
    </div>
  `;
}

export function createItemCard(item: ItemDetail, index: number): string {
  const isText = item.type === 'text';
  const btnColor = isText ? 'violet' : 'amber';
  const icon = isText ? '📝' : '📄';
  
  return `
    <div class="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-lg p-4 hover:border-violet-500/30 transition-all group">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl shrink-0">
          ${icon}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-medium text-white truncate">${item.title || '未命名'}</h3>
            <span class="px-2 py-0.5 text-xs rounded-full bg-${btnColor}-500/20 text-${btnColor}-400 border border-${btnColor}-500/30">
              ${isText ? '文本' : '文件'}
            </span>
          </div>
            <p class="text-sm text-slate-400 truncate">${isText ? (item.content || '无内容') : (item.fileName || '无文件名')}</p>
            <p class="text-xs text-slate-500 mt-1">${formatTime(item.createdAt)}</p>
        </div>
        <div class="flex flex-col gap-2">
          <button 
            onclick="window.handleItemAction(${item.id}, '${isText ? 'copy' : 'download'}')"
            class="w-10 h-10 rounded-lg bg-${btnColor}-600 hover:bg-${btnColor}-500 text-white shadow-lg shadow-${btnColor}-500/30 transition-all flex items-center justify-center"
            title="${isText ? '复制' : '下载'}"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              ${isText 
                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>'
                : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>'
              }
            </svg>
          </button>
          <button 
            onclick="window.handleItemAction(${item.id}, 'delete')"
            class="w-10 h-10 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
            title="删除"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN');
}

function getTextPreview(item: ItemDetail): string {
  if (item.type !== 'text') {
    return '无内容';
  }

  return item.content?.trim() || '无内容';
}
