import './styles.css';
import { createLoginPage, createWorkspace, createMobileSendPage, createItemsPanel } from './ui';
import { getAuthSession, clearAuthSession, getDeviceId, setAuthSession } from './auth/store';
import { getCurrentApiBaseUrl, isValidApiBaseUrl, resetApiBaseUrl, setApiBaseUrl } from './config/runtime';
import { createRealtimeConnection, type RealtimeStatus } from './realtime/ws';
import { createUploadQueue } from './features/files/queue';
import { listItemDetails, createTextItem, getItemDetail, prepareFileDownload, deleteItem } from './features/items/api';
import { cleanupFiles } from './features/files/api';
import { listDevices, revokeDevice } from './features/devices/api';
import type { DeviceInfo } from '../../../packages/contracts/v1';
import { showToast } from './ui/components/toast';
import { ApiClient } from './api/client';
import { refreshWithToken, loginWithPassword } from './api/auth';

// DOM 元素引用
let app: HTMLDivElement;
let itemsController: ItemsController | null = null;
let uploadQueue: ReturnType<typeof createUploadQueue> | null = null;
let realtime: ReturnType<typeof createRealtimeConnection> | null = null;
let apiClient: ApiClient | null = null;
let activeMobileTab: 'send' | 'items' = 'send';
let isMobileViewport = false;
let viewportEventsBound = false;
let viewportRaf: number | null = null;
let devicesCache: DeviceInfo[] = [];
let deviceManagerOpen = false;
let configModalOpen = false;
let revokingDeviceId: string | null = null;
let revokeConfirmDeviceId: string | null = null;
let globalPasteEventsBound = false;
let savingConfig = false;

// 初始化应用
async function init() {
  app = document.querySelector<HTMLDivElement>('#app')!;
  
  if (!app) {
    throw new Error('Missing #app root element');
  }
  
  // 检查登录状态
  if (getAuthSession().accessToken) {
    showWorkspace();
  } else {
    showLogin();
  }
}

// 显示登录页
function showLogin() {
  closeDeviceManager();
  closeConfigModal();
  app.innerHTML = createLoginPage();
  ensureConfigModal();
  bindConfigButtonEvents();
  
  // 绑定登录事件
  const form = document.getElementById('login-form') as HTMLFormElement;
  form?.addEventListener('submit', handleLogin);
}

// 处理登录
async function handleLogin(e: Event) {
  e.preventDefault();
  
  const username = (document.getElementById('login-username') as HTMLInputElement)?.value;
  const password = (document.getElementById('login-password') as HTMLInputElement)?.value;
  const statusEl = document.getElementById('auth-status');
  const btn = document.getElementById('login-btn') as HTMLButtonElement;
  
  if (!username || !password) return;
  
  try {
    btn.disabled = true;
    statusEl!.textContent = '登录中...';
    
    // 调用登录 API
    const session = await loginWithPassword({ 
      baseUrl: getCurrentApiBaseUrl(),
      username, 
      password,
    });
    setAuthSession(session.tokens, session.username, session.deviceId);
    
    statusEl!.textContent = '登录成功';
    showWorkspace();
  } catch (err) {
    statusEl!.textContent = '登录失败: ' + (err instanceof Error ? err.message : '未知错误');
    btn.disabled = false;
  }
}

// 显示工作台
function showWorkspace() {
  app.innerHTML = createWorkspace();

  apiClient = createApiClient();
  
  // 初始化控制器
  itemsController = new ItemsController();
  uploadQueue = createUploadQueue(apiClient, {
    onChange: renderQueue,
    onUploadCompleted: () => {
      itemsController?.loadItems();
    },
  });
  
  // 初始化 WebSocket
  realtime = createRealtime();
  
  // 绑定事件
  bindWorkspaceEvents();
  bindGlobalPasteEvents();
  ensureDeviceManagerModal();
  ensureConfigModal();
  bindViewportEvents();
  loadDevices();

  // 初始化响应式布局
  syncResponsiveLayout(true);
  
  // 连接 WebSocket
  realtime.connect();
}

// 绑定工作台事件
function bindWorkspaceEvents() {
  const desktopRoot = document.getElementById('workspace-desktop');

  // 退出登录
  document.querySelectorAll('#logout-btn').forEach((button) => {
    button.addEventListener('click', () => {
      clearAuthSession();
      realtime?.disconnect();
      showLogin();
    });
  });
  
  // 发送文本
  desktopRoot?.querySelector('#text-form')?.addEventListener('submit', handleSendText);
  
  // 文件上传
  const dropzone = desktopRoot?.querySelector('#upload-dropzone');
  const fileInput = desktopRoot?.querySelector('#file-input') as HTMLInputElement | null;
  
  dropzone?.addEventListener('click', () => fileInput?.click());
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-violet-500', 'bg-violet-500/10');
  });
  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-violet-500', 'bg-violet-500/10');
  });
  dropzone?.addEventListener('drop', (e) => {
    const event = e as DragEvent;
    event.preventDefault();
    dropzone.classList.remove('border-violet-500', 'bg-violet-500/10');
    const files = Array.from(event.dataTransfer?.files || []);
    files.forEach(file => uploadQueue?.enqueue([file]));
  });
  
  fileInput?.addEventListener('change', () => {
    const files = Array.from(fileInput.files || []);
    files.forEach(file => uploadQueue?.enqueue([file]));
    fileInput.value = '';
  });
  
  // 清理队列
  document.querySelectorAll('#queue-clear-btn').forEach((button) => {
    button.addEventListener('click', () => {
      uploadQueue?.clearFinished();
      renderQueue();
    });
  });

  document.querySelectorAll('#manage-devices-btn').forEach((button) => {
    button.addEventListener('click', () => {
      openDeviceManager();
    });
  });

  bindConfigButtonEvents();
}

function bindConfigButtonEvents() {
  document.querySelectorAll('#open-config-btn').forEach((button) => {
    button.addEventListener('click', () => {
      ensureConfigModal();
      openConfigModal();
    });
  });
}

// 发送文本
async function handleSendText(e: Event) {
  e.preventDefault();
  e.stopPropagation();

  const form = e.target as HTMLFormElement | null;
  if (!form) return;
  
  const btn = form.querySelector('#text-submit-btn') as HTMLButtonElement | null;
  if (btn?.disabled) return;
  
  const titleInput = form.querySelector('#text-title') as HTMLInputElement | null;
  const contentInput = form.querySelector('#text-content') as HTMLTextAreaElement | null;
  
  const title = titleInput?.value;
  const content = contentInput?.value;
  
  if (!content) {
    showToast('请输入内容', 'error');
    return;
  }
  
  if (!apiClient) {
    showToast('API 客户端未初始化，请重新登录', 'error');
    return;
  }
  
  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = '发送中...';
    }
    
    await createTextItem(apiClient, { title, content });
    if (titleInput) titleInput.value = '';
    if (contentInput) contentInput.value = '';
    itemsController?.loadItems();
    
    if (btn) {
      btn.textContent = '发送';
      btn.disabled = false;
    }
  } catch (err) {
    console.error('发送失败:', err);
    showToast('发送失败: ' + (err instanceof Error ? err.message : '未知错误'), 'error');
    if (btn) {
      btn.textContent = '发送';
      btn.disabled = false;
    }
  }
}

// 初始化移动端布局
function initMobileLayout() {
  const content = document.getElementById('mobile-content');
  if (content) {
    renderMobileTab(activeMobileTab);
    // 绑定事件（只绑定一次）
    bindMobileEvents();
    renderQueue();
  }
}

// 标记是否已绑定移动端事件
let mobileEventsBound = false;

// 绑定移动端事件（使用事件委托避免重复绑定）
function bindMobileEvents() {
  // 如果已经绑定过，不再重复绑定
  if (mobileEventsBound) return;
  mobileEventsBound = true;
  
  const content = document.getElementById('mobile-content');
  if (!content) return;
  
  // 使用事件委托，只绑定一次到容器
  content.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement;
    if (form.id === 'text-form') {
      e.preventDefault();
      e.stopPropagation();
      handleSendText(e);
    }
  });
  
  // 文件上传按钮点击
  content.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const clearBtn = target.closest('#queue-clear-btn');
    if (clearBtn) {
      uploadQueue?.clearFinished();
      renderQueue();
      return;
    }

    const dropzone = target.closest('#upload-dropzone');
    if (dropzone) {
      const fileInput = content.querySelector('#file-input') as HTMLInputElement | null;
      fileInput?.click();
    }
  });
  
  // 文件选择变化（事件委托，避免动态内容替换后监听失效）
  content.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input?.id !== 'file-input') return;
    const files = Array.from(input.files || []);
    files.forEach(file => uploadQueue?.enqueue([file]));
    input.value = '';
  });
}

// 全局标签切换函数
(window as any).switchMobileTab = (tab: 'send' | 'items') => {
  activeMobileTab = tab;
  renderMobileTab(tab);
};

function renderMobileTab(tab: 'send' | 'items') {
  const content = document.getElementById('mobile-content');
  if (!content) return;

  const buttons = document.querySelectorAll('.mobile-tab-btn');
  
  buttons.forEach(btn => {
    const isActive = btn.getAttribute('data-tab') === tab;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('text-violet-400', isActive);
    btn.classList.toggle('text-slate-400', !isActive);
  });
  
  if (tab === 'send') {
    content.innerHTML = createMobileSendPage();
    // 事件委托已绑定到容器，无需重新绑定
    renderQueue();
  } else {
    content.innerHTML = createItemsPanel();
    itemsController?.loadItems();
  }
}

function bindViewportEvents() {
  if (viewportEventsBound) return;
  viewportEventsBound = true;

  const onViewportChange = () => {
    if (viewportRaf !== null) {
      cancelAnimationFrame(viewportRaf);
    }
    viewportRaf = requestAnimationFrame(() => {
      syncResponsiveLayout();
      viewportRaf = null;
    });
  };

  window.addEventListener('resize', onViewportChange);
  window.addEventListener('orientationchange', onViewportChange);
}

function bindGlobalPasteEvents() {
  if (globalPasteEventsBound) return;
  globalPasteEventsBound = true;
  document.addEventListener('paste', handleGlobalPaste);
}

async function handleGlobalPaste(event: ClipboardEvent) {
  if (event.defaultPrevented) return;
  if (isEditableTarget(event.target)) return;

  if (!getAuthSession().accessToken) return;
  if (!document.getElementById('workspace-desktop') && !document.getElementById('workspace-mobile')) return;
  if (!apiClient) return;

  const clipboardData = event.clipboardData;
  if (!clipboardData) return;

  const files = Array.from(clipboardData.files || []);
  if (files.length > 0) {
    event.preventDefault();
    uploadQueue?.enqueue(files);
    showToast(`已粘贴并开始上传 ${files.length} 个文件`, 'success');
    return;
  }

  const text = clipboardData.getData('text/plain').trim();
  if (!text) return;

  try {
    event.preventDefault();
    await createTextItem(apiClient, { content: text });
    itemsController?.loadItems();
    showToast('已粘贴并发送文本', 'success');
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误';
    showToast(`粘贴处理失败: ${message}`, 'error');
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;

  if (element.closest('input, textarea, [contenteditable], [role="textbox"]')) {
    return true;
  }

  return false;
}

function syncResponsiveLayout(force = false) {
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  if (!force && mobile === isMobileViewport) return;
  isMobileViewport = mobile;

  const mobileRoot = document.getElementById('workspace-mobile');
  const desktopRoot = document.getElementById('workspace-desktop');
  if (!mobileRoot || !desktopRoot) return;

  if (mobile) {
    initMobileLayout();
    renderMobileTab(activeMobileTab);
  } else {
    itemsController?.loadItems();
  }
}

// 全局条目操作函数
(window as any).handleItemAction = async (id: string, action: string) => {
  if (action === 'delete') {
    try {
      if (!apiClient) {
        showToast('API 客户端未初始化', 'error');
        return;
      }

      const item = await getItemDetail(apiClient, id);
      if (item.type === 'file') {
        await cleanupFiles(apiClient, { itemIds: [id], reason: 'manual' });
      } else {
        await deleteItem(apiClient, id);
      }

      showToast('已删除', 'success');
      itemsController?.loadItems();
    } catch (err) {
      console.error('删除失败:', err);
      const message = err instanceof Error ? err.message : '删除失败';
      showToast(`删除失败: ${message}`, 'error');
    }
  } else if (action === 'copy') {
    // 复制文本到剪贴板
    try {
      if (!apiClient) {
        showToast('API 客户端未初始化', 'error');
        return;
      }

      // 获取条目详情
      const item = await getItemDetail(apiClient, id);

      if (item.type !== 'text' || !item.content) {
        showToast('无法复制此内容', 'error');
        return;
      }

      // 复制到剪贴板
      await copyTextToClipboard(item.content);
      showToast('已复制到剪贴板', 'success');

    } catch (err) {
      console.error('复制失败:', err);
      const message = err instanceof Error ? err.message : '复制失败';
      showToast(`复制失败: ${message}`, 'error');
    }
  } else if (action === 'download') {
    try {
      if (!apiClient) {
        showToast('API 客户端未初始化', 'error');
        return;
      }

      const item = await getItemDetail(apiClient, id);
      if (item.type !== 'file' || !item.fileId) {
        showToast('不是可下载的文件条目', 'error');
        return;
      }

      const prepared = await prepareFileDownload(apiClient, item.fileId);
      await triggerFileDownload(prepared.downloadUrl, prepared.fileName || item.fileName || 'download.bin');
      showToast('已开始下载（保存到系统下载目录）', 'success');
    } catch (err) {
      console.error('下载失败:', err);
      const message = err instanceof Error ? err.message : '下载失败';
      showToast(`下载失败: ${message}`, 'error');
    }
  }
};

(window as any).retryUpload = (id: string) => {
  uploadQueue?.retry(id);
};

async function loadDevices() {
  const countEls = document.querySelectorAll<HTMLElement>('#device-count');
  const listEls = document.querySelectorAll<HTMLElement>('#device-list');
  if (countEls.length === 0 || listEls.length === 0 || !apiClient) return;

  try {
    const devices = await listDevices(apiClient);
    devicesCache = devices;
    const activeDevices = devices.filter((device) => !device.revokedAt);

    countEls.forEach((el) => {
      el.textContent = String(activeDevices.length);
    });

    const currentDeviceId = getAuthSession().deviceId;
    const listHtml = activeDevices.map((device) => {
      const currentTag = device.deviceId === currentDeviceId
        ? '<span class="text-[10px] text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded">当前</span>'
        : '';

      return `
        <div class="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
          <div>
            <div class="text-sm text-slate-200">${escapeHtml(device.deviceName || '未命名设备')}</div>
            <div class="text-xs text-slate-500">${escapeHtml(device.platform)} · ${formatDeviceTime(device.lastSeenAt)}</div>
          </div>
          ${currentTag}
        </div>
      `;
    }).join('');

    const emptyHtml = '<div class="px-2 py-1.5 text-xs text-slate-500">暂无在线设备</div>';
    listEls.forEach((el) => {
      el.innerHTML = activeDevices.length === 0 ? emptyHtml : listHtml;
    });

    renderDeviceManagerModal();
  } catch (err) {
    console.error('加载设备列表失败:', err);
    devicesCache = [];
    countEls.forEach((el) => {
      el.textContent = '--';
    });
    listEls.forEach((el) => {
      el.innerHTML = '<div class="px-2 py-1.5 text-xs text-red-400">设备加载失败</div>';
    });
    renderDeviceManagerModal();
  }
}

function ensureDeviceManagerModal() {
  if (document.getElementById('device-manager-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'device-manager-modal';
  modal.className = 'fixed inset-0 z-[200] hidden';
  modal.innerHTML = `
    <div id="device-manager-backdrop" class="absolute inset-0 bg-black/70"></div>
    <div class="absolute inset-0 flex items-center justify-center p-4">
      <div class="w-full max-w-xl rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/60">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
          <div>
            <h3 class="text-base font-semibold text-slate-100">设备管理</h3>
            <p class="text-xs text-slate-500 mt-0.5">可下线异常设备，当前设备不可下线</p>
          </div>
          <button id="device-manager-close" type="button" class="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">✕</button>
        </div>
        <div id="device-manager-list" class="max-h-[65vh] overflow-y-auto custom-scrollbar p-3"></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'device-manager-backdrop' || target.id === 'device-manager-close') {
      closeDeviceManager();
      return;
    }

    const revokeBtn = target.closest('[data-action="revoke-device"]') as HTMLElement | null;
    if (revokeBtn) {
      const deviceId = revokeBtn.dataset.deviceId;
      if (deviceId) {
        revokeConfirmDeviceId = deviceId;
        renderDeviceManagerModal();
      }
      return;
    }

    const confirmBtn = target.closest('[data-action="confirm-revoke-device"]') as HTMLElement | null;
    if (confirmBtn) {
      const deviceId = confirmBtn.dataset.deviceId;
      if (deviceId) {
        handleRevokeDevice(deviceId);
      }
      return;
    }

    const cancelBtn = target.closest('[data-action="cancel-revoke-device"]') as HTMLElement | null;
    if (cancelBtn) {
      revokeConfirmDeviceId = null;
      renderDeviceManagerModal();
      return;
    }
  });
}

function openDeviceManager() {
  const modal = document.getElementById('device-manager-modal');
  if (!modal) return;

  deviceManagerOpen = true;
  modal.classList.remove('hidden');
  renderDeviceManagerModal();
}

function closeDeviceManager() {
  const modal = document.getElementById('device-manager-modal');
  if (!modal) return;

  deviceManagerOpen = false;
  revokeConfirmDeviceId = null;
  modal.classList.add('hidden');
}

function ensureConfigModal() {
  if (document.getElementById('runtime-config-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'runtime-config-modal';
  modal.className = 'fixed inset-0 z-[210] hidden';
  modal.innerHTML = `
    <div id="runtime-config-backdrop" class="absolute inset-0 bg-black/70"></div>
    <div class="absolute inset-0 flex items-center justify-center p-4">
      <div class="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/60">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
          <div>
            <h3 class="text-base font-semibold text-slate-100">连接配置</h3>
            <p class="text-xs text-slate-500 mt-0.5">修改后端地址后将立即重连</p>
          </div>
          <button id="runtime-config-close" type="button" class="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form id="runtime-config-form" class="px-5 py-4 space-y-4">
          <div>
            <label for="runtime-config-api-base-url" class="block text-sm text-slate-300 mb-1.5">后端地址</label>
            <input
              id="runtime-config-api-base-url"
              type="url"
              spellcheck="false"
              placeholder="http://127.0.0.1:8080"
              class="w-full h-11 px-3 bg-slate-900/80 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 transition-all"
            />
            <p id="runtime-config-error" class="hidden mt-1.5 text-xs text-red-400"></p>
            <p class="mt-2 text-xs text-slate-500">当前生效：<span id="runtime-config-current" class="text-slate-300"></span></p>
          </div>

          <div class="flex items-center justify-end gap-2">
            <button id="runtime-config-reset" type="button" class="px-3 py-2 rounded-lg text-xs text-slate-300 bg-slate-800/70 hover:bg-slate-700/80 transition-colors">恢复默认</button>
            <button id="runtime-config-cancel" type="button" class="px-3 py-2 rounded-lg text-xs text-slate-300 bg-slate-800/70 hover:bg-slate-700/80 transition-colors">取消</button>
            <button id="runtime-config-save" type="submit" class="px-3 py-2 rounded-lg text-xs text-white bg-violet-600 hover:bg-violet-500 transition-colors">保存并应用</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'runtime-config-backdrop' || target.id === 'runtime-config-close' || target.id === 'runtime-config-cancel') {
      closeConfigModal();
      return;
    }

    if (target.id === 'runtime-config-reset') {
      void handleResetRuntimeConfig();
    }
  });

  const form = modal.querySelector<HTMLFormElement>('#runtime-config-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    void handleSaveRuntimeConfig();
  });
}

function openConfigModal() {
  const modal = document.getElementById('runtime-config-modal');
  if (!modal) return;

  configModalOpen = true;
  modal.classList.remove('hidden');
  renderConfigModal();
}

function closeConfigModal() {
  const modal = document.getElementById('runtime-config-modal');
  if (!modal) return;

  configModalOpen = false;
  setRuntimeConfigError('');
  modal.classList.add('hidden');
}

function renderConfigModal() {
  if (!configModalOpen) return;

  const input = document.getElementById('runtime-config-api-base-url') as HTMLInputElement | null;
  const current = document.getElementById('runtime-config-current');
  const saveButton = document.getElementById('runtime-config-save') as HTMLButtonElement | null;
  const resetButton = document.getElementById('runtime-config-reset') as HTMLButtonElement | null;
  if (!input || !current || !saveButton || !resetButton) return;

  const apiBaseUrl = getCurrentApiBaseUrl();
  input.value = apiBaseUrl;
  current.textContent = apiBaseUrl;

  saveButton.disabled = savingConfig;
  saveButton.textContent = savingConfig ? '应用中...' : '保存并应用';
  resetButton.disabled = savingConfig;
  input.disabled = savingConfig;
}

function setRuntimeConfigError(message: string) {
  const errorEl = document.getElementById('runtime-config-error');
  if (!errorEl) return;

  errorEl.textContent = message;
  if (message) {
    errorEl.classList.remove('hidden');
  } else {
    errorEl.classList.add('hidden');
  }
}

async function handleSaveRuntimeConfig() {
  const input = document.getElementById('runtime-config-api-base-url') as HTMLInputElement | null;
  if (!input) return;

  const nextApiBaseUrl = input.value.trim();
  if (!isValidApiBaseUrl(nextApiBaseUrl)) {
    setRuntimeConfigError('请输入合法的 http/https 地址，例如 http://127.0.0.1:8080');
    return;
  }

  try {
    savingConfig = true;
    setRuntimeConfigError('');
    renderConfigModal();

    setApiBaseUrl(nextApiBaseUrl);
    await applyRuntimeApiBaseUrl();

    showToast('后端地址已更新并生效', 'success');
    closeConfigModal();
  } catch (err) {
    const message = err instanceof Error ? err.message : '配置保存失败';
    setRuntimeConfigError(message);
    showToast(`配置应用失败: ${message}`, 'error');
  } finally {
    savingConfig = false;
    renderConfigModal();
  }
}

async function handleResetRuntimeConfig() {
  try {
    savingConfig = true;
    setRuntimeConfigError('');
    renderConfigModal();

    resetApiBaseUrl();
    await applyRuntimeApiBaseUrl();

    showToast('已恢复默认地址并生效', 'success');
    closeConfigModal();
  } catch (err) {
    const message = err instanceof Error ? err.message : '恢复默认配置失败';
    setRuntimeConfigError(message);
    showToast(`恢复默认失败: ${message}`, 'error');
  } finally {
    savingConfig = false;
    renderConfigModal();
  }
}

async function applyRuntimeApiBaseUrl() {
  apiClient = createApiClient();

  realtime?.disconnect();
  realtime = createRealtime();
  if (getAuthSession().accessToken) {
    realtime.connect();
  }

  await Promise.all([
    itemsController?.loadItems(),
    loadDevices(),
  ]);
}

function renderDeviceManagerModal() {
  const listEl = document.getElementById('device-manager-list');
  if (!listEl || !deviceManagerOpen) return;

  const currentDeviceId = getAuthSession().deviceId;
  if (devicesCache.length === 0) {
    listEl.innerHTML = '<div class="px-3 py-8 text-center text-sm text-slate-500">暂无设备数据</div>';
    return;
  }

  listEl.innerHTML = devicesCache.map((device) => {
    const isCurrent = device.deviceId === currentDeviceId;
    const isRevoked = Boolean(device.revokedAt);

    const action = isCurrent
      ? '<span class="text-xs text-violet-300 bg-violet-500/20 px-2 py-1 rounded-md">当前设备</span>'
      : isRevoked
        ? '<span class="text-xs text-slate-400 bg-slate-700/60 px-2 py-1 rounded-md">已下线</span>'
        : renderRevokeAction(device.deviceId, revokingDeviceId === device.deviceId);

    return `
      <div class="rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-3 mb-2">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm text-slate-200 truncate">${escapeHtml(device.deviceName || '未命名设备')}</p>
            <p class="text-xs text-slate-500 mt-1">${escapeHtml(device.platform)} · 最近在线 ${formatDeviceTime(device.lastSeenAt)}</p>
          </div>
          ${action}
        </div>
      </div>
    `;
  }).join('');
}

async function handleRevokeDevice(deviceId: string) {
  if (!apiClient) {
    showToast('API 客户端未初始化', 'error');
    return;
  }

  if (deviceId === getAuthSession().deviceId) {
    showToast('当前设备不能下线', 'error');
    return;
  }

  try {
    revokingDeviceId = deviceId;
    revokeConfirmDeviceId = null;
    renderDeviceManagerModal();
    await revokeDevice(apiClient, deviceId);
    showToast('设备已下线', 'success');
    await loadDevices();
  } catch (err) {
    console.error('下线设备失败:', err);
    const message = err instanceof Error ? err.message : '下线失败';
    showToast(`下线失败: ${message}`, 'error');
  } finally {
    revokingDeviceId = null;
    renderDeviceManagerModal();
  }
}

function renderRevokeAction(deviceId: string, busy: boolean): string {
  const escapedId = escapeHtml(deviceId);
  if (revokeConfirmDeviceId === deviceId) {
    return `
      <div class="flex items-center gap-1">
        <button type="button" data-action="confirm-revoke-device" data-device-id="${escapedId}" class="text-xs text-red-200 bg-red-500/30 hover:bg-red-500/40 px-2 py-1 rounded-md transition-colors ${busy ? 'opacity-60 pointer-events-none' : ''}">
          ${busy ? '处理中...' : '确认下线'}
        </button>
        <button type="button" data-action="cancel-revoke-device" class="text-xs text-slate-300 bg-slate-700/70 hover:bg-slate-700 px-2 py-1 rounded-md transition-colors ${busy ? 'opacity-60 pointer-events-none' : ''}">
          取消
        </button>
      </div>
    `;
  }

  return `<button type="button" data-action="revoke-device" data-device-id="${escapedId}" class="text-xs text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-md transition-colors ${busy ? 'opacity-60 pointer-events-none' : ''}">
    ${busy ? '处理中...' : '下线'}
  </button>`;
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall back to execCommand
    }
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const copied = document.execCommand('copy');
  document.body.removeChild(textArea);

  if (!copied) {
    throw new Error('浏览器禁止写入剪贴板');
  }
}

function formatDeviceTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '未知时间';

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚在线';
  if (minutes < 60) return `${minutes} 分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;

  return date.toLocaleDateString('zh-CN');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function triggerFileDownload(url: string, fileName: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载请求失败（${response.status}）`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 3000);
}

// 更新连接状态
function updateConnectionStatus(status: RealtimeStatus) {
  const indicators = document.querySelectorAll<HTMLElement>('#connection-indicator');
  const texts = document.querySelectorAll<HTMLElement>('#connection-status-text');
  if (indicators.length === 0 || texts.length === 0) return;
  
  const statusMap: Record<RealtimeStatus, { color: string; text: string }> = {
    idle: { color: 'bg-slate-500', text: '未连接' },
    connecting: { color: 'bg-yellow-500', text: '连接中...' },
    open: { color: 'bg-emerald-500', text: '已连接' },
    reconnecting: { color: 'bg-orange-500', text: '重连中...' },
    closed: { color: 'bg-red-500', text: '已断开' },
    error: { color: 'bg-red-500', text: '连接错误' },
  };
  
  const { color, text: statusText } = statusMap[status];
  indicators.forEach((indicator) => {
    indicator.className = `w-2.5 h-2.5 rounded-full ${color} status-dot`;
  });
  texts.forEach((text) => {
    text.textContent = statusText;
  });
}

// 渲染上传队列
function renderQueue() {
  const queueEls = Array.from(document.querySelectorAll<HTMLElement>('#upload-queue'));
  if (!uploadQueue || queueEls.length === 0) return;

  const items = uploadQueue.getItems();
  if (items.length === 0) {
    const empty = `
      <div class="text-center py-8 text-slate-500 text-sm">
        <svg class="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
        </svg>
        队列为空
      </div>
    `;
    queueEls.forEach((el) => {
      el.innerHTML = empty;
    });
    return;
  }

  const statusMeta: Record<string, { text: string; color: string }> = {
    queued: { text: '等待中', color: 'text-slate-400' },
    preparing: { text: '准备上传', color: 'text-cyan-400' },
    uploading: { text: '上传中', color: 'text-violet-400' },
    completing: { text: '完成确认', color: 'text-amber-400' },
    done: { text: '已完成', color: 'text-emerald-400' },
    failed: { text: '失败', color: 'text-red-400' },
  };

  const html = items.map((item) => {
    const meta = statusMeta[item.status] ?? statusMeta.queued;
    const retryButton = item.status === 'failed'
      ? `<button onclick='window.retryUpload(${JSON.stringify(item.id)})' class="text-xs text-violet-300 hover:text-violet-200 transition-colors">重试</button>`
      : '';
    const errorText = item.error
      ? `<p class="text-xs text-red-400 mt-1 break-all">${escapeHtml(item.error)}</p>`
      : '';

    return `
      <div class="rounded-lg border border-slate-700/60 bg-slate-900/50 p-2.5">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm text-slate-200 truncate">${escapeHtml(item.file.name)}</p>
            <p class="text-xs ${meta.color}">${meta.text}</p>
          </div>
          ${retryButton}
        </div>
        ${errorText}
      </div>
    `;
  }).join('');

  queueEls.forEach((el) => {
    el.innerHTML = html;
  });
}

type FileKind =
  | 'text'
  | 'word'
  | 'pdf'
  | 'image'
  | 'archive'
  | 'excel'
  | 'ppt'
  | 'audio'
  | 'video'
  | 'code'
  | 'other';

function getItemIconSvg(item: any): string {
  if (item?.type === 'text') {
    return iconByKind.text;
  }

  const ext = getFileExtension(String(item?.fileName || item?.title || ''));
  const kind = resolveFileKind(ext);
  return iconByKind[kind] ?? iconByKind.other;
}

function getFileExtension(fileName: string): string {
  const normalized = fileName.trim().toLowerCase();
  const dotIndex = normalized.lastIndexOf('.');
  if (dotIndex < 0 || dotIndex === normalized.length - 1) return '';
  return normalized.slice(dotIndex + 1);
}

function resolveFileKind(ext: string): FileKind {
  if (!ext) return 'other';
  if (['txt', 'md', 'rtf'].includes(ext)) return 'text';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'bmp'].includes(ext)) return 'image';
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) return 'archive';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
  if (['ppt', 'pptx', 'key'].includes(ext)) return 'ppt';
  if (['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'].includes(ext)) return 'audio';
  if (['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v'].includes(ext)) return 'video';
  if (['js', 'ts', 'jsx', 'tsx', 'json', 'yaml', 'yml', 'xml', 'html', 'css', 'go', 'py', 'java', 'c', 'cpp', 'rs', 'sh'].includes(ext)) return 'code';
  return 'other';
}

const iconByKind: Record<FileKind, string> = {
  text: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="48" height="52" rx="10" fill="#7b4dff"/><path d="M42 6v14h14" fill="#9d7aff"/><rect x="16" y="25" width="32" height="4" rx="2" fill="#f4edff"/><rect x="16" y="34" width="22" height="4" rx="2" fill="#d9c9ff"/></svg>',
  word: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="48" height="52" rx="10" fill="#1c73ff"/><path d="M42 6v14h14" fill="#4a93ff"/><rect x="15" y="34" width="34" height="16" rx="6" fill="#f0f7ff"/><rect x="20" y="39" width="24" height="2.8" rx="1.4" fill="#1c73ff"/><rect x="20" y="44" width="18" height="2.8" rx="1.4" fill="#4a93ff"/></svg>',
  pdf: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="48" height="52" rx="10" fill="#ff3b4f"/><path d="M42 6v14h14" fill="#ff6a78"/><rect x="16" y="33" width="32" height="17" rx="6" fill="#fff1f3"/><path d="M21 45l5-7 4 5 4-6 6 8" fill="none" stroke="#ff3b4f" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  image: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="48" height="48" rx="12" fill="#00bfa6"/><circle cx="24" cy="24" r="6" fill="#edfffb"/><path d="M14 46l12-12 8 8 6-5 10 9" fill="none" stroke="#edfffb" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  archive: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="48" height="52" rx="10" fill="#f7b212"/><path d="M42 6v14h14" fill="#ffca4b"/><rect x="26" y="20" width="12" height="4" rx="1.5" fill="#fff"/><rect x="28" y="26" width="8" height="4" rx="1.5" fill="#fff"/><rect x="26" y="32" width="12" height="4" rx="1.5" fill="#fff"/><rect x="24" y="40" width="16" height="8" rx="3" fill="#fff"/><rect x="30" y="42" width="4" height="4" rx="1" fill="#f7b212"/></svg>',
  excel: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="48" height="52" rx="10" fill="#08a66d"/><path d="M42 6v14h14" fill="#2fd48f"/><rect x="16" y="33" width="32" height="16" rx="6" fill="#ebfff4"/><rect x="20" y="37" width="10" height="10" rx="2" fill="#08a66d"/><rect x="32" y="37" width="12" height="2.8" rx="1.4" fill="#08a66d"/><rect x="32" y="41.6" width="12" height="2.8" rx="1.4" fill="#2fd48f"/></svg>',
  ppt: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="48" height="52" rx="10" fill="#ff8a00"/><path d="M42 6v14h14" fill="#ffab3d"/><rect x="16" y="34" width="32" height="15" rx="6" fill="#fff5e7"/><rect x="20" y="38" width="8" height="6" rx="2" fill="#ff8a00"/><rect x="30" y="38" width="14" height="2" rx="1" fill="#ff8a00"/><rect x="30" y="42" width="10" height="2" rx="1" fill="#ff8a00"/></svg>',
  audio: '<svg class="w-7 h-7" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><circle cx="512" cy="512" r="384" fill="#9a5cff"/><g transform="translate(210 200) scale(0.58)"><path d="M875.52 433.152q-7.168-1.024-12.8-10.24t-8.704-33.792q-5.12-39.936-26.112-58.88t-65.024-27.136q-46.08-9.216-81.408-37.376t-58.88-52.736q-22.528-21.504-34.816-15.36t-12.288 22.528l0 44.032 0 96.256q0 57.344-0.512 123.904t-0.512 125.952l0 104.448 0 58.368q1.024 24.576-7.68 54.784t-32.768 56.832-64 45.568-99.328 22.016q-60.416 3.072-109.056-21.504t-75.264-61.952-26.112-81.92 38.4-83.456 81.92-54.272 84.992-16.896 73.216 5.632 47.616 13.312l0-289.792q0-120.832 1.024-272.384 0-29.696 15.36-48.64t40.96-22.016q21.504-3.072 35.328 8.704t28.16 32.768 35.328 47.616 56.832 52.224q30.72 23.552 53.76 33.792t43.008 18.944 39.424 20.992 43.008 39.936q23.552 26.624 28.672 55.296t0.512 52.224-14.848 38.4-17.408 13.824z" fill="#f1e7ff"/></g></svg>',
  video: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="12" width="48" height="40" rx="10" fill="#2d7dff"/><polygon points="28,24 43,32 28,40" fill="#eef5ff"/><rect x="14" y="18" width="6" height="28" rx="3" fill="#eef5ff"/></svg>',
  code: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="10" width="48" height="44" rx="10" fill="#4f5dff"/><path d="M20 24l-6 8 6 8" fill="none" stroke="#f0f4ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 24l6 8-6 8" fill="none" stroke="#f0f4ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="29" y="22" width="6" height="20" rx="3" fill="#b6c2ff"/></svg>',
  other: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="48" height="52" rx="10" fill="#6f7a99"/><path d="M42 6v14h14" fill="#92a0c2"/><circle cx="32" cy="39" r="9" fill="#eef3ff"/><circle cx="32" cy="39" r="3" fill="#8494ba"/></svg>',
};

// Items 控制器类
class ItemsController {
  async loadItems() {
    const listEls = Array.from(document.querySelectorAll<HTMLElement>('#items-list'));
    const loadingEls = Array.from(document.querySelectorAll<HTMLElement>('#items-loading'));
    const emptyEls = Array.from(document.querySelectorAll<HTMLElement>('#items-empty'));

    if (listEls.length === 0) return;
    
    try {
      loadingEls.forEach((el) => el.classList.remove('hidden'));
      emptyEls.forEach((el) => el.classList.add('hidden'));
      
      if (!apiClient) {
        throw new Error('API client is not initialized');
      }

      const items = await listItemDetails(apiClient, 50);
      
      loadingEls.forEach((el) => el.classList.add('hidden'));
      
      if (items.length === 0) {
        emptyEls.forEach((el) => el.classList.remove('hidden'));
        listEls.forEach((el) => {
          el.innerHTML = '';
        });
      } else {
        const html = items.map((item, index) => this.renderItem(item, index)).join('');
        listEls.forEach((el) => {
          el.innerHTML = html;
        });
      }
    } catch (err) {
      loadingEls.forEach((el) => el.classList.add('hidden'));
      console.error('加载条目失败:', err);
    }
  }
  
  private renderItem(item: any, index: number): string {
    const isText = item.type === 'text';
    const btnColor = isText ? 'violet' : 'amber';
    const icon = getItemIconSvg(item);
    
    return `
      <div class="bg-slate-900/85 border border-slate-700/50 rounded-lg p-4 hover:border-violet-500/30 transition-all group">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-slate-800/70 flex items-center justify-center shrink-0">
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
            <p class="text-xs text-slate-500 mt-1">${new Date(item.createdAt).toLocaleString('zh-CN')}</p>
          </div>
          <div class="flex flex-col gap-2">
            <button 
              onclick='window.handleItemAction(${JSON.stringify(item.id)}, "${isText ? 'copy' : 'download'}")'
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
              onclick='window.handleItemAction(${JSON.stringify(item.id)}, "delete")'
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
}

function createRealtime(): ReturnType<typeof createRealtimeConnection> {
  return createRealtimeConnection({
    apiBaseUrl: getCurrentApiBaseUrl(),
    getAccessToken: () => getAuthSession().accessToken,
    onEvent: () => {
      itemsController?.loadItems();
    },
    onStatusChange: (status) => {
      updateConnectionStatus(status);
    },
  });
}

function createApiClient(): ApiClient {
  return new ApiClient({
    baseUrl: getCurrentApiBaseUrl(),
    getAccessToken: () => getAuthSession().accessToken,
    getDeviceId,
    onUnauthorized: () => {
      clearAuthSession();
      realtime?.disconnect();
      showLogin();
    },
    refreshAccessToken: async () => {
      const session = getAuthSession();
      if (!session.refreshToken || !session.deviceId) {
        return false;
      }

      try {
        const refreshed = await refreshWithToken(getCurrentApiBaseUrl(), session.refreshToken, session.deviceId);
        setAuthSession(refreshed.tokens, session.username, refreshed.deviceId);
        return true;
      } catch {
        return false;
      }
    },
  });
}

// 启动应用
init().catch(console.error);
