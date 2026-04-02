export function createMobileTabs(): string {
  return `
    <nav class="fixed bottom-0 left-0 right-0 h-16 border-t border-slate-800/50 bg-slate-900/90 flex items-center justify-around z-50">
      <button 
        onclick="window.switchMobileTab('send')" 
        data-tab="send" 
        class="mobile-tab-btn active flex flex-col items-center gap-1 py-2 px-6 text-violet-400 transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
        </svg>
        <span class="text-xs font-medium">发送</span>
      </button>
      <button 
        onclick="window.switchMobileTab('items')" 
        data-tab="items" 
        class="mobile-tab-btn flex flex-col items-center gap-1 py-2 px-6 text-slate-400 transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-xs font-medium">条目</span>
      </button>
    </nav>
  `;
}
