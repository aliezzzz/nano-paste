import { createHeader } from './header';
import { createSendPanel } from './send-text';
import { createUploadPanel } from './file-upload';
import { createItemsPanel } from './items-list';
import { createMobileTabs } from './mobile-tabs';

export function createWorkspace(): string {
  return `
    <!-- Desktop Layout (md and up) -->
    <div class="hidden md:flex flex-col h-full" id="workspace-desktop">
      ${createHeader()}
      <main class="relative z-0 flex-1 overflow-hidden flex">
        <aside class="w-96 border-r border-slate-800/50 bg-slate-900/30 flex flex-col shrink-0">
          ${createSendPanel()}
          ${createUploadPanel({ compact: false })}
        </aside>
        
        <section class="flex-1 flex flex-col min-h-0 bg-slate-900/20">
          ${createItemsPanel()}
        </section>
      </main>
    </div>

    <!-- Mobile Layout (below md) -->
    <div class="flex md:hidden flex-col h-screen overflow-hidden" id="workspace-mobile">
      <div class="relative z-50">
        ${createHeader()}
      </div>
      
      <main class="flex-1 overflow-y-auto relative pb-16" id="mobile-content">
        <!-- Dynamic content injected here -->
      </main>
      
      ${createMobileTabs()}
    </div>
  `;
}

export function createMobileSendPage(): string {
  return `
    <div class="h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
      <div class="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-xl p-4">
        ${createSendPanel()}
      </div>
      
      <div class="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-xl p-4">
        ${createUploadPanel({ compact: true })}
      </div>
    </div>
  `;
}
