<script setup lang="ts">
import { computed, ref } from "vue";
import ThemeToggle from "./ThemeToggle.vue";
import SendPanel from "./workspace/SendPanel.vue";
import UploadPanel from "./workspace/UploadPanel.vue";
import ItemsPanel from "./workspace/ItemsPanel.vue";
import MobileTabs from "./workspace/MobileTabs.vue";
import type { MobileTab } from "./workspace/MobileTabs.vue";
import TopicList from "./workspace/TopicList.vue";
import type { TopicInfo } from "./workspace/TopicList.vue";
import TrayTemplateIcon from "../assets/icons/tray-template.svg";
import SettingsIcon from "../assets/icons/settings.svg";
import LogoutIcon from "../assets/icons/logout.svg";
import type { UploadQueueViewItem } from "./workspace/UploadPanel.vue";
import type { ItemView, ItemActionPayload } from "../types/workspace";
import ImagePreviewModal from "./modals/ImagePreviewModal.vue";

type SendPayload = { title?: string; content: string; tags?: string[]; topic?: string };

const props = withDefaults(
    defineProps<{
        queueItems?: UploadQueueViewItem[];
        items?: ItemView[];
        itemsLoading?: boolean;
        sendingText?: boolean;
        username?: string;
        imagePreview?: { imageUrl: string; fileName: string; fileSize?: number } | null;
        topics?: TopicInfo[];
        activeTopic?: string;
    }>(),
    {
        queueItems: () => [],
        items: () => [],
        itemsLoading: false,
        sendingText: false,
        username: "",
        imagePreview: null,
        topics: () => [],
        activeTopic: "",
    },
);

const userInitial = computed(() => {
    const name = props.username?.trim() || "";
    return name.charAt(0).toUpperCase() || "?";
});

const emit = defineEmits<{
    (e: "open-config"): void;
    (e: "logout"): void;
    (e: "refresh-items"): void;
    (e: "retry-upload", id: string): void;
    (e: "cancel-upload", id: string): void;
    (e: "clear-finished-upload"): void;
    (e: "send-text", payload: SendPayload): void;
    (e: "upload-files", files: File[]): void;
    (e: "item-action", payload: ItemActionPayload): void;
    (e: "close-image-preview"): void;
    (e: "select-topic", topic: string): void;
}>(); 

const activeMobileTab = ref<MobileTab>("send");

function openConfig(): void {
    emit("open-config");
}

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
    if (tab === "settings") {
        openConfig();
        return;
    }
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
                    <span class="host-brand-text">NanoPaste</span>
                </div>

                <div class="host-header-actions">
                    <ThemeToggle class="mr-2" />
                    <button
                        id="open-config-btn"
                        type="button"
                        title="连接配置"
                        aria-label="连接配置"
                        class="host-icon-btn"
                        @click="openConfig"
                    >
                        <SettingsIcon
                            class="host-icon-btn-icon"
                            aria-hidden="true"
                        />
                    </button>

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
                        :topic-suggestions="props.topics.map(t => t.name)"
                        @submit="sendText"
                    />
                    <UploadPanel
                        :queue-items="props.queueItems"
                        @retry="retryUpload"
                        @cancel="cancelUpload"
                        @clear-finished="clearFinishedUpload"
                        @files-selected="uploadFiles"
                    />
                    <TopicList
                        :topics="props.topics"
                        :active-topic="props.activeTopic"
                        @select-topic="selectTopic"
                    />
                </aside>
                <section class="host-content">
                    <ItemsPanel
                        :items="props.items"
                        :loading="props.itemsLoading"
                        @item-action="itemAction"
                        @refresh-items="refreshItems"
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
                        <button
                            id="open-config-btn"
                            type="button"
                            title="连接配置"
                            aria-label="连接配置"
                            class="host-icon-btn"
                            @click="openConfig"
                        >
                            <SettingsIcon
                                class="host-icon-btn-icon"
                                aria-hidden="true"
                            />
                        </button>
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

            <main class="host-mobile-main safe-bottom-tabs" id="mobile-content">
                <div
                    v-if="activeMobileTab === 'send'"
                    class="host-mobile-send custom-scrollbar"
                >
                    <div class="host-mobile-card">
                        <SendPanel
                            :submitting="props.sendingText"
                            :topic-suggestions="props.topics.map(t => t.name)"
                            @submit="sendText"
                        />
                    </div>
                    <div class="host-mobile-card">
                        <UploadPanel
                            compact
                            :queue-items="props.queueItems"
                            @retry="retryUpload"
                            @cancel="cancelUpload"
                            @clear-finished="clearFinishedUpload"
                            @files-selected="uploadFiles"
                        />
                    </div>
                </div>
                <div v-else class="host-mobile-items custom-scrollbar">
                    <ItemsPanel
                        :items="props.items"
                        :loading="props.itemsLoading"
                        @item-action="itemAction"
                        @refresh-items="refreshItems"
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
    </div>
</template>
