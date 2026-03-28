interface UploadPanelOptions {
  compact?: boolean;
}

export function createUploadPanel(options: UploadPanelOptions = {}): string {
  const { compact = false } = options;
  
  return `
    <div class="${compact ? 'p-4' : 'flex-1 flex flex-col min-h-0 p-4 sm:p-5'}">
      <h2 class="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
        <svg class="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
        </svg>
        上传文件
      </h2>
      
      <!-- Dropzone -->
      <div 
        id="upload-dropzone"
        class="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer transition-all hover:border-slate-500 hover:bg-slate-800/30 mb-4"
      >
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
          <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
        </div>
        <p class="text-sm text-slate-300 font-medium mb-1">拖拽文件到这里</p>
        <p class="text-xs text-slate-500">或点击选择文件</p>
        <input type="file" id="file-input" class="hidden" multiple>
      </div>

      <!-- Upload Queue Header -->
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-slate-400">上传队列</span>
        <button id="queue-clear-btn" class="text-xs text-violet-400 hover:text-violet-300 transition-colors">
          清理已完成
        </button>
      </div>
      
      <!-- Upload Queue List -->
      <div id="upload-queue" class="${compact ? '' : 'flex-1 overflow-y-auto custom-scrollbar min-h-0'} space-y-2">
        <div class="text-center py-8 text-slate-500 text-sm">
          <svg class="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
          </svg>
          队列为空
        </div>
      </div>
    </div>
  `;
}
