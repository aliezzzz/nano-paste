<script setup lang="ts">
import { ref } from "vue";
import SendPanel from "./workspace/SendPanel.vue";
import UploadPanel from "./workspace/UploadPanel.vue";
import ItemsPanel from "./workspace/ItemsPanel.vue";
import MobileTabs from "./workspace/MobileTabs.vue";
import type { UploadQueueViewItem } from "./workspace/UploadPanel.vue";
import type { ItemView } from "./workspace/ItemsPanel.vue";
import type { ActiveDeviceView } from "../bridge";
import type { RealtimeStatus } from "../realtime/ws";

type SendPayload = { title?: string; content: string };

const props = withDefaults(defineProps<{
  queueItems?: UploadQueueViewItem[];
  items?: ItemView[];
  itemsLoading?: boolean;
  activeDevices?: ActiveDeviceView[];
  sendingText?: boolean;
  connectionStatus?: RealtimeStatus;
}>(), {
  queueItems: () => [],
  items: () => [],
  itemsLoading: false,
  activeDevices: () => [],
  sendingText: false,
  connectionStatus: "idle",
});

const connectionStatusMap: Record<RealtimeStatus, { color: string; text: string }> = {
  idle: { color: "bg-slate-500", text: "未连接" },
  connecting: { color: "bg-yellow-500", text: "连接中..." },
  open: { color: "bg-emerald-500", text: "已连接" },
  reconnecting: { color: "bg-orange-500", text: "重连中..." },
  closed: { color: "bg-red-500", text: "已断开" },
  error: { color: "bg-red-500", text: "连接错误" },
};

const emit = defineEmits<{
  (e: "open-config"): void;
  (e: "open-device-manager"): void;
  (e: "logout"): void;
  (e: "retry-upload", id: string): void;
  (e: "clear-finished-upload"): void;
  (e: "send-text", payload: SendPayload): void;
  (e: "upload-files", files: File[]): void;
  (e: "item-action", payload: { id: string; action: "copy" | "download" | "delete" }): void;
}>();

const activeMobileTab = ref<"send" | "items">("send");

function openConfig(): void {
  emit("open-config");
}

function openDeviceManager(): void {
  emit("open-device-manager");
}

function logout(): void {
  emit("logout");
}

function retryUpload(id: string): void {
  emit("retry-upload", id);
}

function clearFinishedUpload(): void {
  emit("clear-finished-upload");
}

function itemAction(payload: { id: string; action: "copy" | "download" | "delete" }): void {
  emit("item-action", payload);
}

function switchMobileTab(tab: "send" | "items"): void {
  activeMobileTab.value = tab;
}

function sendText(payload: SendPayload): void {
  emit("send-text", payload);
}

function uploadFiles(files: File[]): void {
  emit("upload-files", files);
}
</script>

<template>
  <div class="h-full w-full">
    <div class="hidden md:flex flex-col h-screen" id="workspace-desktop">
      <header class="relative z-[80] h-16 border-b border-slate-800/50 bg-slate-900/85 flex items-center justify-between px-4 sm:px-6 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </div>
          <span class="font-bold text-lg hidden sm:block">NanoPaste</span>
        </div>

        <div class="flex items-center gap-4">
          <div class="relative group z-[90]">
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-700/50 transition-colors">
              <span id="connection-indicator" class="w-2.5 h-2.5 rounded-full status-dot" :class="connectionStatusMap[props.connectionStatus].color"></span>
              <span id="connection-status-text" class="text-sm text-slate-300 hidden sm:inline">{{ connectionStatusMap[props.connectionStatus].text }}</span>
              <span class="text-sm text-slate-400 font-mono text-xs flex items-center gap-1">
                <span>{{ props.activeDevices.length }}</span> 设备
                <svg class="w-3 h-3 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </span>
            </div>

            <div class="absolute top-full right-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
              <div class="glass border border-slate-700/50 rounded-xl p-3 shadow-xl shadow-black/50">
                <div class="text-xs text-slate-500 mb-2 px-2">在线设备</div>
                <div class="space-y-1">
                  <template v-if="props.activeDevices.length > 0">
                    <div v-for="device in props.activeDevices" :key="device.deviceId" class="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <div>
                        <div class="text-sm text-slate-200">{{ device.deviceName }}</div>
                        <div class="text-xs text-slate-500">{{ device.platform }}</div>
                      </div>
                      <span v-if="device.isCurrent" class="text-[10px] text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded">当前</span>
                    </div>
                  </template>
                  <div v-else class="px-2 py-1.5 text-xs text-slate-500">暂无在线设备</div>
                </div>
                <div class="mt-2 pt-2 border-t border-slate-700/50">
                  <button id="manage-devices-btn" type="button" class="w-full text-xs text-violet-400 hover:text-violet-300 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors" @click="openDeviceManager">
                    管理设备
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button id="open-config-btn" type="button" title="连接配置" aria-label="连接配置" class="w-9 h-9 rounded-lg border border-slate-700/60 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/70 transition-colors flex items-center justify-center" @click="openConfig">
            <svg viewBox="0 0 1024 1024" class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M512 426.666667c-46.933333 0-85.333333 38.4-85.333333 85.333333s38.4 85.333333 85.333333 85.333333 85.333333-38.4 85.333333-85.333333-38.4-85.333333-85.333333-85.333333z m298.666667-298.666667H213.333333a85.333333 85.333333 0 0 0-85.333333 85.333333v597.333334a85.333333 85.333333 0 0 0 85.333333 85.333333h597.333334a85.333333 85.333333 0 0 0 85.333333-85.333333V213.333333a85.333333 85.333333 0 0 0-85.333333-85.333333z m-74.666667 384c0 9.813333-0.853333 19.626667-2.133333 29.013333l63.146666 49.493334c5.546667 4.693333 7.253333 12.8 3.413334 19.2l-59.733334 103.253333c-3.84 6.4-11.52 8.96-18.346666 6.4l-74.24-29.866667c-15.36 11.946667-32.426667 21.76-50.346667 29.44l-11.093333 78.933334c-1.28 7.253333-7.68 12.8-14.933334 12.8h-119.466666c-7.253333 0-13.653333-5.546667-14.933334-12.373334l-11.093333-78.933333c-18.346667-7.68-34.986667-17.493333-50.346667-29.44l-74.24 29.866667c-6.826667 2.56-14.506667 0-18.346666-6.4l-59.733334-103.253334a15.061333 15.061333 0 0 1 3.413334-19.2l63.146666-49.493333c-1.28-9.813333-2.133333-19.626667-2.133333-29.44 0-9.813333 0.853333-19.626667 2.133333-29.013333l-63.146666-49.493334a15.061333 15.061333 0 0 1-3.413334-19.2l59.733334-103.253333c3.84-6.4 11.52-8.96 18.346666-6.4l74.24 29.866667c15.36-11.946667 32.426667-21.76 50.346667-29.44l11.093333-78.933334c1.28-7.253333 7.68-12.8 14.933334-12.8h119.466666c7.253333 0 13.653333 5.546667 14.933334 12.373334l11.093333 78.933333c18.346667 7.68 34.986667 17.493333 50.346667 29.44l74.24-29.866667c6.826667-2.56 14.506667 0 18.346666 6.4l59.733334 103.253334c3.84 6.4 2.133333 14.506667-3.413334 19.2l-63.146666 49.493333c1.28 9.813333 2.133333 19.626667 2.133333 29.44z" fill="currentColor"></path>
            </svg>
          </button>

          <button class="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 border border-slate-500 flex items-center justify-center text-sm font-semibold hover:border-violet-500/50 transition-colors">U</button>

          <button id="logout-btn" class="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors" @click="logout">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </button>
        </div>
      </header>

      <main class="relative z-0 flex-1 overflow-hidden flex">
        <aside class="w-96 border-r border-slate-800/50 bg-slate-900/30 flex flex-col shrink-0">
          <SendPanel :submitting="props.sendingText" @submit="sendText" />
          <UploadPanel :queue-items="props.queueItems" @retry="retryUpload" @clear-finished="clearFinishedUpload" @files-selected="uploadFiles" />
        </aside>
        <section class="flex-1 flex flex-col min-h-0 bg-slate-900/20">
          <ItemsPanel :items="props.items" :loading="props.itemsLoading" @item-action="itemAction" />
        </section>
      </main>
    </div>

    <div class="flex md:hidden flex-col h-screen overflow-hidden" id="workspace-mobile">
      <div class="relative z-50">
        <header class="relative z-[80] h-16 border-b border-slate-800/50 bg-slate-900/85 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </div>
            <span class="font-bold text-lg">NanoPaste</span>
          </div>
          <div class="flex items-center gap-2">
            <button id="open-config-btn" type="button" title="连接配置" aria-label="连接配置" class="w-9 h-9 rounded-lg border border-slate-700/60 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/70 transition-colors flex items-center justify-center" @click="openConfig">
              <svg viewBox="0 0 1024 1024" class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M512 426.666667c-46.933333 0-85.333333 38.4-85.333333 85.333333s38.4 85.333333 85.333333 85.333333 85.333333-38.4 85.333333-85.333333-38.4-85.333333-85.333333-85.333333z m298.666667-298.666667H213.333333a85.333333 85.333333 0 0 0-85.333333 85.333333v597.333334a85.333333 85.333333 0 0 0 85.333333 85.333333h597.333334a85.333333 85.333333 0 0 0 85.333333-85.333333V213.333333a85.333333 85.333333 0 0 0-85.333333-85.333333z m-74.666667 384c0 9.813333-0.853333 19.626667-2.133333 29.013333l63.146666 49.493334c5.546667 4.693333 7.253333 12.8 3.413334 19.2l-59.733334 103.253333c-3.84 6.4-11.52 8.96-18.346666 6.4l-74.24-29.866667c-15.36 11.946667-32.426667 21.76-50.346667 29.44l-11.093333 78.933334c-1.28 7.253333-7.68 12.8-14.933334 12.8h-119.466666c-7.253333 0-13.653333-5.546667-14.933334-12.373334l-11.093333-78.933333c-18.346667-7.68-34.986667-17.493333-50.346667-29.44l-74.24 29.866667c-6.826667 2.56-14.506667 0-18.346666-6.4l-59.733334-103.253334a15.061333 15.061333 0 0 1 3.413334-19.2l63.146666-49.493333c-1.28-9.813333-2.133333-19.626667-2.133333-29.44 0-9.813333 0.853333-19.626667 2.133333-29.013333l-63.146666-49.493334a15.061333 15.061333 0 0 1-3.413334-19.2l59.733334-103.253333c3.84-6.4 11.52-8.96 18.346666-6.4l74.24 29.866667c15.36-11.946667 32.426667-21.76 50.346667-29.44l11.093333-78.933334c1.28-7.253333 7.68-12.8 14.933334-12.8h119.466666c7.253333 0 13.653333 5.546667 14.933334 12.373334l11.093333 78.933333c18.346667 7.68 34.986667 17.493333 50.346667 29.44l74.24-29.866667c6.826667-2.56 14.506667 0 18.346666 6.4l59.733334 103.253334c3.84 6.4 2.133333 14.506667-3.413334 19.2l-63.146666 49.493333c1.28 9.813333 2.133333 19.626667 2.133333 29.44z" fill="currentColor"></path>
              </svg>
            </button>
            <button id="logout-btn" class="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors" @click="logout">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </button>
          </div>
        </header>
      </div>

      <main class="flex-1 overflow-y-auto relative pb-16" id="mobile-content">
        <div v-if="activeMobileTab === 'send'" class="h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
          <div class="bg-slate-900/85 border border-slate-700/50 rounded-xl p-4">
            <SendPanel :submitting="props.sendingText" @submit="sendText" />
          </div>
          <div class="bg-slate-900/85 border border-slate-700/50 rounded-xl p-4">
            <UploadPanel compact :queue-items="props.queueItems" @retry="retryUpload" @clear-finished="clearFinishedUpload" @files-selected="uploadFiles" />
          </div>
        </div>
        <div v-else class="h-full overflow-y-auto custom-scrollbar p-4">
          <div class="bg-slate-900/85 border border-slate-700/50 rounded-xl p-4 h-full min-h-[420px]">
            <ItemsPanel :items="props.items" :loading="props.itemsLoading" @item-action="itemAction" />
          </div>
        </div>
      </main>

      <MobileTabs :active-tab="activeMobileTab" @switch="switchMobileTab" />
    </div>
  </div>
</template>
