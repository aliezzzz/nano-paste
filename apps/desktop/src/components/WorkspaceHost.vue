<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import ThemeToggle from "./ThemeToggle.vue";
import SendPanel from "./workspace/SendPanel.vue";
import UploadPanel from "./workspace/UploadPanel.vue";
import ItemsPanel from "./workspace/ItemsPanel.vue";
import MobileTabs from "./workspace/MobileTabs.vue";
import type { MobileTab } from "./workspace/MobileTabs.vue";
import type { TopicInfo } from "./workspace/TopicList.vue";
import TrayTemplateIcon from "../assets/icons/tray-template.svg";
import LogoutIcon from "../assets/icons/logout.svg";
import type { UploadQueueViewItem } from "./workspace/UploadPanel.vue";
import type { ItemView, ItemActionPayload } from "../types/workspace";
import ImagePreviewModal from "./modals/ImagePreviewModal.vue";
import CodePreviewModal from "./modals/CodePreviewModal.vue";

type SendPayload = { title?: string; content: string; tags?: string[]; topic?: string; contentKind?: "text" | "code"; language?: string };

const props = withDefaults(
    defineProps<{
        queueItems?: UploadQueueViewItem[];
        items?: ItemView[];
        itemsLoading?: boolean;
        sendingText?: boolean;
        sentTextVersion?: number;
        username?: string;
        imagePreview?: { imageUrl: string; fileName: string; fileSize?: number } | null;
        codePreview?: { title?: string; code: string; language?: string } | null;
        topics?: TopicInfo[];
        activeTopic?: string;
    }>(),
    {
        queueItems: () => [],
        items: () => [],
        itemsLoading: false,
        sendingText: false,
        sentTextVersion: 0,
        username: "",
        imagePreview: null,
        codePreview: null,
        topics: () => [],
        activeTopic: "",
    },
);

const userInitial = computed(() => {
    const name = props.username?.trim() || "";
    return name.charAt(0).toUpperCase() || "?";
});

const emit = defineEmits<{
    (e: "logout"): void;
    (e: "refresh-items"): void;
    (e: "retry-upload", id: string): void;
    (e: "cancel-upload", id: string): void;
    (e: "clear-finished-upload"): void;
    (e: "send-text", payload: SendPayload): void;
    (e: "upload-files", files: File[]): void;
    (e: "item-action", payload: ItemActionPayload): void;
    (e: "close-image-preview"): void;
    (e: "close-code-preview"): void;
    (e: "select-topic", topic: string): void;
}>(); 

const activeMobileTab = ref<MobileTab>("send");
const workspaceSearch = ref("");
const searchInputRef = ref<HTMLInputElement | null>(null);

function handleSearchShortcut(e: KeyboardEvent): void {
    if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        searchInputRef.value?.focus();
    }
}

onMounted(() => {
    document.addEventListener("keydown", handleSearchShortcut);
});

onUnmounted(() => {
    document.removeEventListener("keydown", handleSearchShortcut);
});

function logout(): void {
    emit("logout");
}

function retryUpload(id: string): void {
    emit("retry-upload", id);
}

function cancelUpload(id: string): void {
    emit("cancel-upload", id);
}

function clearFinishedUpload(): void {
    emit("clear-finished-upload");
}

function itemAction(payload: ItemActionPayload): void {
    emit("item-action", payload);
}

function refreshItems(): void {
    emit("refresh-items");
}

function switchMobileTab(tab: MobileTab): void {
    activeMobileTab.value = tab;
}

function sendText(payload: SendPayload): void {
    emit("send-text", payload);
}

function uploadFiles(files: File[]): void {
    emit("upload-files", files);
}

function closeImagePreview(): void {
    emit("close-image-preview");
}

function closeCodePreview(): void {
    emit("close-code-preview");
}

function selectTopic(topic: string): void {
    emit("select-topic", topic);
}
</script>

<template>
    <div class="host-root">
        <div class="host-desktop" id="workspace-desktop">
            <header class="host-header">
                <div class="host-brand-wrap">
                    <div class="host-brand-icon-wrap">
                        <TrayTemplateIcon class="host-brand-icon" />
                    </div>
                    <div class="host-brand-copy">
                        <span class="host-brand-text">NanoPaste</span>
                        <span class="host-brand-subtitle">快速投递，随处粘贴</span>
                    </div>
                </div>

                <label class="host-search" aria-label="搜索剪贴板内容">
                    <span class="host-search-icon" aria-hidden="true"></span>
                    <input
                        ref="searchInputRef"
                        v-model="workspaceSearch"
                        class="host-search-input"
                        type="search"
                        placeholder="搜索剪贴板内容..."
                    />
                    <span class="host-search-kbd">Ctrl /</span>
                </label>

                <div class="host-header-actions">
                    <ThemeToggle class="mr-2" />

                    <div class="host-user-wrap group">
                        <button
                            type="button"
                            title="用户菜单"
                            aria-label="用户菜单"
                            class="host-user-trigger"
                        >
                            {{ userInitial }}
                        </button>
                        <div class="host-user-dropdown">
                            <div class="host-user-dropdown-card glass">
                                <div class="host-user-profile">
                                    <div class="host-user-profile-row">
                                        <div class="host-user-avatar">
                                            {{ userInitial }}
                                        </div>
                                        <div class="host-user-name-wrap">
                                            <div class="host-user-name">
                                                {{
                                                    props.username ||
                                                    "未命名用户"
                                                }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    id="logout-btn"
                                    type="button"
                                    class="host-logout-btn"
                                    @click="logout"
                                >
                                    <LogoutIcon class="host-logout-btn-icon" />
                                    退出登录
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main class="host-main">
                <aside class="host-sidebar">
                    <SendPanel
                        :submitting="props.sendingText"
                        :clear-version="props.sentTextVersion"
                        :topic-suggestions="props.topics.map(t => t.name)"
                        @submit="sendText"
                        @files-selected="uploadFiles"
                    />
                    <UploadPanel
                        :queue-items="props.queueItems"
                        @retry="retryUpload"
                        @cancel="cancelUpload"
                        @clear-finished="clearFinishedUpload"
                        @files-selected="uploadFiles"
                    />
                </aside>
                <section class="host-content">
                    <ItemsPanel
                        :items="props.items"
                        :loading="props.itemsLoading"
                        :topics="props.topics"
                        :active-topic="props.activeTopic"
                        :search-query="workspaceSearch"
                        @item-action="itemAction"
                        @refresh-items="refreshItems"
                        @select-topic="selectTopic"
                        @update:search-query="workspaceSearch = $event"
                    />
                </section>
            </main>
        </div>

        <div class="host-mobile" id="workspace-mobile">
            <div class="host-mobile-top">
                <header class="host-header host-mobile-header safe-top">
                    <div class="host-brand-wrap">
                        <div class="host-brand-icon-wrap">
                            <TrayTemplateIcon class="host-brand-icon" />
                        </div>
                        <span class="host-brand-text-mobile">NanoPaste</span>
                    </div>
                    <div class="host-mobile-actions">
                        <ThemeToggle class="mr-2 scale-90" />
                        <div class="host-user-wrap group">
                            <button
                                type="button"
                                title="用户菜单"
                                aria-label="用户菜单"
                                class="host-user-trigger"
                            >
                                {{ userInitial }}
                            </button>
                            <div class="host-user-dropdown">
                                <div class="host-user-dropdown-card glass">
                                    <div class="host-user-profile">
                                        <div class="host-user-profile-row">
                                            <div class="host-user-avatar">
                                                {{ userInitial }}
                                            </div>
                                            <div class="host-user-name-wrap">
                                                <div class="host-user-name">
                                                    {{
                                                        props.username ||
                                                        "未命名用户"
                                                    }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        id="logout-btn-mobile"
                                        type="button"
                                        class="host-logout-btn"
                                        @click="logout"
                                    >
                                        <LogoutIcon class="host-logout-btn-icon" />
                                        退出登录
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            </div>

            <main class="host-mobile-main" id="mobile-content">
                <div
                    v-if="activeMobileTab === 'send'"
                    class="host-mobile-send"
                >
                    <SendPanel
                        :submitting="props.sendingText"
                        :clear-version="props.sentTextVersion"
                        :topic-suggestions="props.topics.map(t => t.name)"
                        @submit="sendText"
                        @files-selected="uploadFiles"
                    />
                    <UploadPanel
                        compact
                        :queue-items="props.queueItems"
                        @retry="retryUpload"
                        @cancel="cancelUpload"
                        @clear-finished="clearFinishedUpload"
                        @files-selected="uploadFiles"
                    />
                </div>
                <div v-else class="host-mobile-items">
                    <ItemsPanel
                        :items="props.items"
                        :loading="props.itemsLoading"
                        :topics="props.topics"
                        :active-topic="props.activeTopic"
                        :mode="activeMobileTab === 'favorites' ? 'favorites' : 'all'"
                        :search-query="workspaceSearch"
                        @item-action="itemAction"
                        @refresh-items="refreshItems"
                        @select-topic="selectTopic"
                        @update:search-query="workspaceSearch = $event"
                    />
                </div>
            </main>

            <MobileTabs
                :active-tab="activeMobileTab"
                @switch="switchMobileTab"
            />
        </div>

        <ImagePreviewModal
            v-if="props.imagePreview"
            :image-url="props.imagePreview.imageUrl"
            :file-name="props.imagePreview.fileName"
            :file-size="props.imagePreview.fileSize"
            @close="closeImagePreview"
        />
        <CodePreviewModal
            v-if="props.codePreview"
            :title="props.codePreview.title"
            :code="props.codePreview.code"
            :language="props.codePreview.language"
            @close="closeCodePreview"
        />
    </div>
</template>

<style scoped>
.host-sidebar {
    gap: 10px;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 12px;
}

.host-brand-copy {
    display: grid;
    gap: 2px;
}

.host-brand-subtitle {
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
}

.host-search {
    position: absolute;
    left: 50%;
    top: 50%;
    display: flex;
    width: min(440px, 38vw);
    height: 40px;
    transform: translate(-50%, -50%);
    align-items: center;
    gap: 10px;
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-control);
    background: var(--input-bg);
    padding: 0 12px 0 16px;
    transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}

.host-search:focus-within {
    border-color: rgba(var(--accent-rgb), 0.38);
    background: var(--bg-card);
    box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
}

.host-search-icon {
    position: relative;
    width: 14px;
    height: 14px;
    flex: 0 0 auto;
    border: 2px solid var(--text-muted);
    border-radius: 999px;
    opacity: 0.72;
}

.host-search-icon::after {
    content: "";
    position: absolute;
    right: -5px;
    bottom: -4px;
    width: 6px;
    height: 2px;
    border-radius: 999px;
    background: var(--text-muted);
    transform: rotate(45deg);
}

.host-search-input {
    min-width: 0;
    flex: 1;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--text-main);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
}

.host-search-input::placeholder {
    color: var(--text-muted);
}

.host-search-kbd {
    flex: 0 0 auto;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-control);
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    padding: 4px 6px;
}

.host-content {
    min-width: 0;
    min-height: 0;
}

.host-mobile-items {
    height: 100%;
    min-height: 0;
    padding: 0;
}

.host-mobile-send {
    display: grid;
    gap: 8px;
    align-content: start;
    height: 100%;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 10px 10px;
}

@media (max-width: 960px) {
    .host-sidebar {
        padding: 10px;
    }

    .host-search {
        display: none;
    }
}
</style>
