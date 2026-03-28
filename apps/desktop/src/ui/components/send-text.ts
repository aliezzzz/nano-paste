export function createSendPanel(): string {
  return `
    <div class="p-4 sm:p-5 border-b border-slate-800/50">
      <h2 class="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
        <svg class="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
        发送文本
      </h2>
      <form id="text-form" class="space-y-3">
        <input 
          type="text" 
          id="text-title"
          placeholder="标题（可选）"
          maxlength="80"
          class="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
        >
        <textarea 
          id="text-content"
          placeholder="输入要同步的文本..."
          rows="3"
          maxlength="500"
          class="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
        ></textarea>
        <button 
          type="submit"
          id="text-submit-btn"
          class="w-full py-2 px-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
          发送
        </button>
      </form>
    </div>
  `;
}
