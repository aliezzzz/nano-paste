<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { loginWithPassword } from "./api/auth";
import { getAuthSession, setAuthSession } from "./auth/store";
import { getCurrentApiBaseUrl, isValidApiBaseUrl, resetApiBaseUrl, setApiBaseUrl } from "./config/runtime";
import { applyRuntimeApiBaseUrlChange, clearFinishedUploads, enqueueFiles, executeItemAction, fetchDevices, getCurrentDeviceId, handleGlobalPasteEvent, initializeBridge, logoutSession, retryUpload, revokeDeviceById, sendTextItem, setBridgeCallbacks } from "./bridge";
import { showToast, subscribeToast, type ToastType } from "./ui/components/toast";
import WorkspaceHost from "./components/WorkspaceHost.vue";
import type { DeviceInfo } from "../../../packages/contracts/v1";
import type { UploadQueueViewItem } from "./components/workspace/UploadPanel.vue";
import type { ItemView } from "./components/workspace/ItemsPanel.vue";
import type { ActiveDeviceView } from "./bridge";
import type { RealtimeStatus } from "./realtime/ws";

const isAuthenticated = ref(Boolean(getAuthSession().accessToken));
const loginUsername = ref("");
const loginPassword = ref("");
const loginStatus = ref("未登录");
const loginSubmitting = ref(false);

const configOpen = ref(false);
const configSubmitting = ref(false);
const configApiBaseUrl = ref(getCurrentApiBaseUrl());
const configError = ref("");
const currentApiBaseUrl = computed(() => getCurrentApiBaseUrl());

const deviceModalOpen = ref(false);
const devicesLoading = ref(false);
const devicesError = ref("");
const devices = ref<DeviceInfo[]>([]);
const revokeConfirmDeviceId = ref("");
const revokingDeviceId = ref("");

const queueItems = ref<UploadQueueViewItem[]>([]);
const items = ref<ItemView[]>([]);
const itemsLoading = ref(false);
const activeDevices = ref<ActiveDeviceView[]>([]);
const sendingText = ref(false);
const connectionStatus = ref<RealtimeStatus>("idle");

interface ToastView {
  id: number;
  message: string;
  type: ToastType;
}

const toasts = ref<ToastView[]>([]);
let toastIdSeed = 0;
let unsubscribeToast: (() => void) | null = null;

setBridgeCallbacks({
  onRequireLogin: () => {
    isAuthenticated.value = false;
    loginStatus.value = "未登录";
    loginPassword.value = "";
    deviceModalOpen.value = false;
    queueItems.value = [];
    items.value = [];
    itemsLoading.value = false;
    activeDevices.value = [];
    sendingText.value = false;
    connectionStatus.value = "idle";
  },
  onUploadQueueChanged: (nextItems) => {
    queueItems.value = nextItems;
  },
  onItemsLoadingChanged: (loading) => {
    itemsLoading.value = loading;
  },
  onItemsChanged: (nextItems) => {
    items.value = nextItems;
  },
  onActiveDevicesChanged: (nextDevices) => {
    activeDevices.value = nextDevices;
  },
  onConnectionStatusChanged: (status) => {
    connectionStatus.value = status;
  },
});

function onPaste(event: ClipboardEvent): void {
  void handleGlobalPasteEvent(event);
}

onMounted(() => {
  window.addEventListener("paste", onPaste);
  unsubscribeToast = subscribeToast((event) => {
    const id = ++toastIdSeed;
    toasts.value.push({ id, message: event.message, type: event.type });
    window.setTimeout(() => {
      toasts.value = toasts.value.filter((toast) => toast.id !== id);
    }, 2000);
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("paste", onPaste);
  unsubscribeToast?.();
  unsubscribeToast = null;
});

watch(isAuthenticated, async (authenticated) => {
  if (!authenticated) {
    return;
  }
  await initializeBridge();
}, { immediate: true });

async function handleLoginSubmit(e: Event): Promise<void> {
  e.preventDefault();
  const username = loginUsername.value.trim();
  const password = loginPassword.value;
  if (!username || !password) {
    return;
  }

  try {
    loginSubmitting.value = true;
    loginStatus.value = "登录中...";
    const session = await loginWithPassword({
      baseUrl: getCurrentApiBaseUrl(),
      username,
      password,
    });

    setAuthSession(session.tokens, session.username, session.deviceId);
    loginStatus.value = "登录成功";
    isAuthenticated.value = true;
  } catch (error) {
    loginStatus.value = `登录失败: ${error instanceof Error ? error.message : "未知错误"}`;
  } finally {
    loginSubmitting.value = false;
  }
}

function openConfig(): void {
  configApiBaseUrl.value = getCurrentApiBaseUrl();
  configError.value = "";
  configOpen.value = true;
}

function closeConfig(): void {
  configOpen.value = false;
  configError.value = "";
}

async function openDeviceManager(): Promise<void> {
  deviceModalOpen.value = true;
  revokeConfirmDeviceId.value = "";
  await loadDevicesForModal();
}

function closeDeviceManager(): void {
  deviceModalOpen.value = false;
  revokeConfirmDeviceId.value = "";
}

async function loadDevicesForModal(): Promise<void> {
  try {
    devicesLoading.value = true;
    devicesError.value = "";
    devices.value = await fetchDevices();
  } catch (error) {
    devicesError.value = error instanceof Error ? error.message : "加载设备失败";
  } finally {
    devicesLoading.value = false;
  }
}

function askRevokeDevice(deviceId: string): void {
  revokeConfirmDeviceId.value = deviceId;
}

function cancelRevokeDevice(): void {
  revokeConfirmDeviceId.value = "";
}

async function confirmRevokeDevice(deviceId: string): Promise<void> {
  if (deviceId === getCurrentDeviceId()) {
    showToast("当前设备不能下线", "error");
    return;
  }

  try {
    revokingDeviceId.value = deviceId;
    await revokeDeviceById(deviceId);
    showToast("设备已下线", "success");
    revokeConfirmDeviceId.value = "";
    await loadDevicesForModal();
  } catch (error) {
    const message = error instanceof Error ? error.message : "下线设备失败";
    showToast(`下线失败: ${message}`, "error");
  } finally {
    revokingDeviceId.value = "";
  }
}

function formatDeviceTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "未知时间";

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚在线";
  if (minutes < 60) return `${minutes} 分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;

  return date.toLocaleDateString("zh-CN");
}

async function saveConfig(): Promise<void> {
  const nextUrl = configApiBaseUrl.value.trim();
  if (!isValidApiBaseUrl(nextUrl)) {
    configError.value = "请输入合法的 http/https 地址，例如 http://127.0.0.1:8080";
    return;
  }

  try {
    configSubmitting.value = true;
    configError.value = "";
    setApiBaseUrl(nextUrl);
    if (isAuthenticated.value) {
      await applyRuntimeApiBaseUrlChange();
    }
    showToast("后端地址已更新并生效", "success");
    closeConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "配置应用失败";
    configError.value = message;
    showToast(`配置应用失败: ${message}`, "error");
  } finally {
    configSubmitting.value = false;
  }
}

async function restoreDefaultConfig(): Promise<void> {
  try {
    configSubmitting.value = true;
    configError.value = "";
    resetApiBaseUrl();
    configApiBaseUrl.value = getCurrentApiBaseUrl();
    if (isAuthenticated.value) {
      await applyRuntimeApiBaseUrlChange();
    }
    showToast("已恢复默认地址并生效", "success");
    closeConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "恢复默认失败";
    configError.value = message;
    showToast(`恢复默认失败: ${message}`, "error");
  } finally {
    configSubmitting.value = false;
  }
}

function handleRetryUpload(id: string): void {
  retryUpload(id);
}

function handleClearFinishedUpload(): void {
  clearFinishedUploads();
}

async function handleItemAction(payload: { id: string; action: "copy" | "download" | "delete" | "favorite"; content?: string }): Promise<void> {
  await executeItemAction(payload.id, payload.action, (id, favorite) => {
    items.value = items.value.map((item) => (
      item.id === id ? { ...item, isFavorite: favorite } : item
    ));
  }, payload.content);
}

async function handleRefreshItems(): Promise<void> {
  try {
    await reloadItems();
  } catch (error) {
    console.error("刷新条目失败:", error);
  }
}

function handleLogout(): void {
  logoutSession();
}

async function handleSendText(payload: { title?: string; content: string }): Promise<void> {
  try {
    sendingText.value = true;
    await sendTextItem(payload);
    showToast("发送成功", "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "发送失败";
    showToast(`发送失败: ${message}`, "error");
  } finally {
    sendingText.value = false;
  }
}

function handleUploadFiles(files: File[]): void {
  enqueueFiles(files);
}

</script>

<template>
  <div class="h-full w-full">
    <template v-if="!isAuthenticated">
      <section id="login-page" class="fixed inset-0 overflow-hidden bg-[#070a14]">
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute inset-x-0 top-0 h-[48vh] bg-[radial-gradient(ellipse_at_top,rgba(88,72,255,0.26),rgba(7,10,20,0.18)_55%,transparent_82%)]"></div>
        </div>

        <button id="open-config-btn" type="button" title="连接配置" aria-label="连接配置" class="absolute top-4 right-4 z-30 w-10 h-10 rounded-lg border border-slate-700/70 bg-slate-900/75 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center justify-center" @click="openConfig">
          <svg viewBox="0 0 1024 1024" class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M512 426.666667c-46.933333 0-85.333333 38.4-85.333333 85.333333s38.4 85.333333 85.333333 85.333333 85.333333-38.4 85.333333-85.333333-38.4-85.333333-85.333333-85.333333z m298.666667-298.666667H213.333333a85.333333 85.333333 0 0 0-85.333333 85.333333v597.333334a85.333333 85.333333 0 0 0 85.333333 85.333333h597.333334a85.333333 85.333333 0 0 0 85.333333-85.333333V213.333333a85.333333 85.333333 0 0 0-85.333333-85.333333z m-74.666667 384c0 9.813333-0.853333 19.626667-2.133333 29.013333l63.146666 49.493334c5.546667 4.693333 7.253333 12.8 3.413334 19.2l-59.733334 103.253333c-3.84 6.4-11.52 8.96-18.346666 6.4l-74.24-29.866667c-15.36 11.946667-32.426667 21.76-50.346667 29.44l-11.093333 78.933334c-1.28 7.253333-7.68 12.8-14.933334 12.8h-119.466666c-7.253333 0-13.653333-5.546667-14.933334-12.373334l-11.093333-78.933333c-18.346667-7.68-34.986667-17.493333-50.346667-29.44l-74.24 29.866667c-6.826667 2.56-14.506667 0-18.346666-6.4l-59.733334-103.253334a15.061333 15.061333 0 0 1 3.413334-19.2l63.146666-49.493333c-1.28-9.813333-2.133333-19.626667-2.133333-29.44 0-9.813333 0.853333-19.626667 2.133333-29.013333l-63.146666-49.493334a15.061333 15.061333 0 0 1-3.413334-19.2l59.733334-103.253333c3.84-6.4 11.52-8.96 18.346666-6.4l74.24 29.866667c15.36-11.946667 32.426667-21.76 50.346667-29.44l11.093333-78.933334c1.28-7.253333 7.68-12.8 14.933334-12.8h119.466666c7.253333 0 13.653333 5.546667 14.933334 12.373334l11.093333 78.933333c18.346667 7.68 34.986667 17.493333 50.346667 29.44l74.24-29.866667c6.826667-2.56 14.506667 0 18.346666 6.4l59.733334 103.253334c3.84 6.4 2.133333 14.506667-3.413334 19.2l-63.146666 49.493333c1.28 9.813333 2.133333 19.626667 2.133333 29.44z" fill="currentColor"></path>
          </svg>
        </button>

        <div class="relative h-full flex items-center justify-center px-4 sm:px-8 py-4 sm:py-6 max-[700px]:py-2">
          <div class="w-full max-w-3xl h-full max-h-[680px] max-[700px]:max-h-[620px] grid grid-cols-1 lg:grid-cols-[1fr_640px] gap-6 lg:gap-10 items-center">
            <div class="hidden lg:block"></div>

            <div class="h-full min-h-0 bg-slate-950/35 px-4 sm:px-8 lg:px-10 py-3 sm:py-6 lg:py-8 max-[700px]:py-2 flex flex-col justify-center">
              <div class="text-center mb-3 sm:mb-6 lg:mb-7 max-[700px]:mb-2">
                <div class="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 mb-3 sm:mb-4 shadow-[0_0_36px_rgba(99,102,241,0.35)]">
                  <svg class="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h1 class="text-[clamp(2.25rem,5vw,4.25rem)] leading-none font-bold bg-gradient-to-r from-indigo-300 via-blue-300 to-cyan-400 bg-clip-text text-transparent">NanoPaste</h1>
                <p class="mt-1.5 sm:mt-3 text-slate-400 text-sm sm:text-xl font-semibold tracking-wide">跨设备同步，即刻开始</p>
              </div>

              <form id="login-form" class="space-y-2.5 sm:space-y-4 lg:space-y-5" @submit="handleLoginSubmit">
                <div>
                  <label class="block text-sm sm:text-[1.6rem] font-semibold text-slate-200 mb-1.5 sm:mb-3">用户名</label>
                  <input v-model="loginUsername" type="text" id="login-username" placeholder="输入用户名" required autocomplete="username" class="w-full h-11 sm:h-14 lg:h-16 px-4 sm:px-6 bg-slate-900/70 border border-slate-700/80 rounded-xl text-base sm:text-2xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 transition-all">
                </div>
                <div>
                  <label class="block text-sm sm:text-[1.6rem] font-semibold text-slate-200 mb-1.5 sm:mb-3">密码</label>
                  <input v-model="loginPassword" type="password" id="login-password" placeholder="输入密码" required autocomplete="current-password" class="w-full h-11 sm:h-14 lg:h-16 px-4 sm:px-6 bg-slate-900/70 border border-slate-700/80 rounded-xl text-base sm:text-2xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 transition-all">
                </div>
                <button type="submit" id="login-btn" :disabled="loginSubmitting" class="w-full h-11 sm:h-14 lg:h-16 mt-2 sm:mt-4 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white text-base sm:text-2xl font-bold rounded-xl transition-all shadow-[0_0_34px_rgba(124,58,237,0.4)] disabled:opacity-70">
                  登录并进入工作台
                </button>
              </form>

              <p id="auth-status" class="mt-3 sm:mt-5 text-center text-sm sm:text-xl text-slate-400">{{ loginStatus }}</p>

              <div class="mt-2 sm:mt-4 text-center">
                <p class="text-xs sm:text-base text-slate-500">v2.0.0 • 安全加密传输</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <WorkspaceHost
      v-else
      :queue-items="queueItems"
      :items="items"
      :items-loading="itemsLoading"
      :active-devices="activeDevices"
      :sending-text="sendingText"
      :connection-status="connectionStatus"
      @open-config="openConfig"
      @open-device-manager="openDeviceManager"
      @logout="handleLogout"
      @send-text="handleSendText"
      @upload-files="handleUploadFiles"
      @retry-upload="handleRetryUpload"
      @clear-finished-upload="handleClearFinishedUpload"
      @item-action="handleItemAction"
      @refresh-items="handleRefreshItems"
    />

    <div v-if="deviceModalOpen" class="fixed inset-0 z-[290]">
      <div class="absolute inset-0 bg-black/70" @click="closeDeviceManager"></div>
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="w-full max-w-xl rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/60">
          <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
            <div>
              <h3 class="text-base font-semibold text-slate-100">设备管理</h3>
              <p class="text-xs text-slate-500 mt-0.5">可下线异常设备，当前设备不可下线</p>
            </div>
            <button type="button" class="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors" @click="closeDeviceManager">✕</button>
          </div>

          <div class="max-h-[65vh] overflow-y-auto custom-scrollbar p-3">
            <div v-if="devicesLoading" class="px-3 py-8 text-center text-sm text-slate-500">加载中...</div>
            <div v-else-if="devicesError" class="px-3 py-8 text-center text-sm text-red-400">{{ devicesError }}</div>
            <div v-else-if="devices.length === 0" class="px-3 py-8 text-center text-sm text-slate-500">暂无设备数据</div>
            <div v-else>
              <div v-for="device in devices" :key="device.deviceId" class="rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-3 mb-2">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-sm text-slate-200 truncate">{{ device.deviceName || '未命名设备' }}</p>
                    <p class="text-xs text-slate-500 mt-1">{{ device.platform }} · 最近在线 {{ formatDeviceTime(device.lastSeenAt) }}</p>
                  </div>

                  <div v-if="device.deviceId === getCurrentDeviceId()" class="text-xs text-violet-300 bg-violet-500/20 px-2 py-1 rounded-md">当前设备</div>
                  <div v-else-if="device.revokedAt" class="text-xs text-slate-400 bg-slate-700/60 px-2 py-1 rounded-md">已下线</div>
                  <div v-else-if="revokeConfirmDeviceId === device.deviceId" class="flex items-center gap-1">
                    <button type="button" class="text-xs text-red-200 bg-red-500/30 hover:bg-red-500/40 px-2 py-1 rounded-md transition-colors" :class="revokingDeviceId === device.deviceId ? 'opacity-60 pointer-events-none' : ''" @click="confirmRevokeDevice(device.deviceId)">
                      {{ revokingDeviceId === device.deviceId ? '处理中...' : '确认下线' }}
                    </button>
                    <button type="button" class="text-xs text-slate-300 bg-slate-700/70 hover:bg-slate-700 px-2 py-1 rounded-md transition-colors" :class="revokingDeviceId === device.deviceId ? 'opacity-60 pointer-events-none' : ''" @click="cancelRevokeDevice">取消</button>
                  </div>
                  <button v-else type="button" class="text-xs text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-md transition-colors" @click="askRevokeDevice(device.deviceId)">
                    下线
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="configOpen" class="fixed inset-0 z-[300]">
      <div class="absolute inset-0 bg-black/70" @click="closeConfig"></div>
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/60">
          <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
            <div>
              <h3 class="text-base font-semibold text-slate-100">连接配置</h3>
              <p class="text-xs text-slate-500 mt-0.5">修改后端地址后将立即重连</p>
            </div>
            <button type="button" class="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors" @click="closeConfig">✕</button>
          </div>

          <form class="px-5 py-4 space-y-4" @submit.prevent="saveConfig">
            <div>
              <label for="runtime-config-api-base-url" class="block text-sm text-slate-300 mb-1.5">后端地址</label>
              <input id="runtime-config-api-base-url" v-model="configApiBaseUrl" type="url" spellcheck="false" placeholder="http://127.0.0.1:8080" class="w-full h-11 px-3 bg-slate-900/80 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 transition-all" />
              <p v-if="configError" class="mt-1.5 text-xs text-red-400">{{ configError }}</p>
              <p class="mt-2 text-xs text-slate-500">当前生效：<span class="text-slate-300">{{ currentApiBaseUrl }}</span></p>
            </div>

            <div class="flex items-center justify-end gap-2">
              <button type="button" class="px-3 py-2 rounded-lg text-xs text-slate-300 bg-slate-800/70 hover:bg-slate-700/80 transition-colors" :disabled="configSubmitting" @click="restoreDefaultConfig">恢复默认</button>
              <button type="button" class="px-3 py-2 rounded-lg text-xs text-slate-300 bg-slate-800/70 hover:bg-slate-700/80 transition-colors" :disabled="configSubmitting" @click="closeConfig">取消</button>
              <button type="submit" class="px-3 py-2 rounded-lg text-xs text-white bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-70" :disabled="configSubmitting">保存并应用</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div class="fixed top-1/4 left-1/2 -translate-x-1/2 z-[400] space-y-2 pointer-events-none">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="px-6 py-3 rounded-lg shadow-xl text-white text-sm font-medium transition-all duration-300"
        :class="toast.type === 'success' ? 'bg-emerald-500/90' : 'bg-red-500/90'"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>
