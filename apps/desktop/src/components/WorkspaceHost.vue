<script setup lang="ts">
import { computed, ref } from "vue";
import SendPanel from "./workspace/SendPanel.vue";
import UploadPanel from "./workspace/UploadPanel.vue";
import ItemsPanel from "./workspace/ItemsPanel.vue";
import MobileTabs from "./workspace/MobileTabs.vue";
import trayTemplateIcon from "../../src-tauri/icons/tray-template.svg?url";
import type { UploadQueueViewItem } from "./workspace/UploadPanel.vue";
import type { ItemView } from "./workspace/ItemsPanel.vue";
import type { ActiveDeviceView } from "../bridge";
import type { RealtimeStatus } from "../realtime/ws";

type SendPayload = { title?: string; content: string };

const props = withDefaults(
    defineProps<{
        queueItems?: UploadQueueViewItem[];
        items?: ItemView[];
        itemsLoading?: boolean;
        activeDevices?: ActiveDeviceView[];
        sendingText?: boolean;
        connectionStatus?: RealtimeStatus;
        username?: string;
    }>(),
    {
        queueItems: () => [],
        items: () => [],
        itemsLoading: false,
        activeDevices: () => [],
        sendingText: false,
        connectionStatus: "idle",
        username: "",
    },
);

const userInitial = computed(() => {
    const name = props.username?.trim() || "";
    return name.charAt(0).toUpperCase() || "?";
});

const connectionStatusMap: Record<
    RealtimeStatus,
    { color: string; text: string }
> = {
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
    (e: "refresh-items"): void;
    (e: "retry-upload", id: string): void;
    (e: "clear-finished-upload"): void;
    (e: "send-text", payload: SendPayload): void;
    (e: "upload-files", files: File[]): void;
    (
        e: "item-action",
        payload: {
            id: string;
            action: "copy" | "download" | "delete" | "favorite";
            type: "text" | "file";
            content?: string;
            fileId?: string;
            fileName?: string;
            isFavorite: boolean;
        },
    ): void;
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

function itemAction(payload: {
    id: string;
    action: "copy" | "download" | "delete" | "favorite";
    type: "text" | "file";
    content?: string;
    fileId?: string;
    fileName?: string;
    isFavorite: boolean;
}): void {
    emit("item-action", payload);
}

function refreshItems(): void {
    emit("refresh-items");
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
    <div class="host-root">
        <div class="host-desktop" id="workspace-desktop">
            <header class="host-header">
                <div class="host-brand-wrap">
                    <div class="host-brand-icon-wrap">
                        <img
                            class="host-brand-icon"
                            :src="trayTemplateIcon"
                            alt="NanoPaste logo"
                        >
                    </div>
                    <span class="host-brand-text">NanoPaste</span>
                </div>

                <div class="host-header-actions">
                    <div class="host-device-dropdown-wrap group">
                        <div class="host-device-chip">
                            <span
                                id="connection-indicator"
                                class="host-connection-dot status-dot"
                                :class="
                                    connectionStatusMap[props.connectionStatus]
                                        .color
                                "
                            ></span>
                            <span
                                id="connection-status-text"
                                class="host-connection-text"
                                >{{
                                    connectionStatusMap[props.connectionStatus]
                                        .text
                                }}</span
                            >
                            <span class="host-device-count">
                                <span>{{ props.activeDevices.length }}</span>
                                设备
                                <svg
                                    class="host-device-count-icon"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M19 9l-7 7-7-7"
                                    ></path>
                                </svg>
                            </span>
                        </div>

                        <div class="host-device-dropdown">
                            <div class="host-device-dropdown-card glass">
                                <div class="host-device-dropdown-title">
                                    在线设备
                                </div>
                                <div class="host-device-list">
                                    <template
                                        v-if="props.activeDevices.length > 0"
                                    >
                                        <div
                                            v-for="device in props.activeDevices"
                                            :key="device.deviceId"
                                            class="host-device-item"
                                        >
                                            <div>
                                                <div
                                                    class="host-device-item-name"
                                                >
                                                    {{ device.deviceName }}
                                                </div>
                                                <div
                                                    class="host-device-item-platform"
                                                >
                                                    {{ device.platform }}
                                                </div>
                                            </div>
                                            <span
                                                v-if="device.isCurrent"
                                                class="host-device-item-current"
                                                >当前</span
                                            >
                                        </div>
                                    </template>
                                    <div v-else class="host-device-item-empty">
                                        暂无在线设备
                                    </div>
                                </div>
                                <div class="host-device-dropdown-footer">
                                    <button
                                        id="manage-devices-btn"
                                        type="button"
                                        class="host-device-manage-btn"
                                        @click="openDeviceManager"
                                    >
                                        管理设备
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        id="open-config-btn"
                        type="button"
                        title="连接配置"
                        aria-label="连接配置"
                        class="host-icon-btn"
                        @click="openConfig"
                    >
                        <svg
                            viewBox="0 0 1024 1024"
                            class="host-icon-btn-icon"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <path
                                d="M512 426.666667c-46.933333 0-85.333333 38.4-85.333333 85.333333s38.4 85.333333 85.333333 85.333333 85.333333-38.4 85.333333-85.333333-38.4-85.333333-85.333333-85.333333z m298.666667-298.666667H213.333333a85.333333 85.333333 0 0 0-85.333333 85.333333v597.333334a85.333333 85.333333 0 0 0 85.333333 85.333333h597.333334a85.333333 85.333333 0 0 0 85.333333-85.333333V213.333333a85.333333 85.333333 0 0 0-85.333333-85.333333z m-74.666667 384c0 9.813333-0.853333 19.626667-2.133333 29.013333l63.146666 49.493334c5.546667 4.693333 7.253333 12.8 3.413334 19.2l-59.733334 103.253333c-3.84 6.4-11.52 8.96-18.346666 6.4l-74.24-29.866667c-15.36 11.946667-32.426667 21.76-50.346667 29.44l-11.093333 78.933334c-1.28 7.253333-7.68 12.8-14.933334 12.8h-119.466666c-7.253333 0-13.653333-5.546667-14.933334-12.373334l-11.093333-78.933333c-18.346667-7.68-34.986667-17.493333-50.346667-29.44l-74.24 29.866667c-6.826667 2.56-14.506667 0-18.346666-6.4l-59.733334-103.253334a15.061333 15.061333 0 0 1 3.413334-19.2l63.146666-49.493333c-1.28-9.813333-2.133333-19.626667-2.133333-29.44 0-9.813333 0.853333-19.626667 2.133333-29.013333l-63.146666-49.493334a15.061333 15.061333 0 0 1-3.413334-19.2l59.733334-103.253333c3.84-6.4 11.52-8.96 18.346666-6.4l74.24 29.866667c15.36-11.946667 32.426667-21.76 50.346667-29.44l11.093333-78.933334c1.28-7.253333 7.68-12.8 14.933334-12.8h119.466666c7.253333 0 13.653333 5.546667 14.933334 12.373334l11.093333 78.933333c18.346667 7.68 34.986667 17.493333 50.346667 29.44l74.24-29.866667c6.826667-2.56 14.506667 0 18.346666 6.4l59.733334 103.253334c3.84 6.4 2.133333 14.506667-3.413334 19.2l-63.146666 49.493333c1.28 9.813333 2.133333 19.626667 2.133333 29.44z"
                                fill="currentColor"
                            ></path>
                        </svg>
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
                                    <svg
                                        class="host-logout-btn-icon"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        ></path>
                                    </svg>
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
                        @submit="sendText"
                    />
                    <UploadPanel
                        :queue-items="props.queueItems"
                        @retry="retryUpload"
                        @clear-finished="clearFinishedUpload"
                        @files-selected="uploadFiles"
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
                            <img
                                class="host-brand-icon"
                                :src="trayTemplateIcon"
                                alt="NanoPaste logo"
                            >
                        </div>
                        <span class="host-brand-text-mobile">NanoPaste</span>
                    </div>
                    <div class="host-mobile-actions">
                        <button
                            id="open-config-btn"
                            type="button"
                            title="连接配置"
                            aria-label="连接配置"
                            class="host-icon-btn"
                            @click="openConfig"
                        >
                            <svg
                                viewBox="0 0 1024 1024"
                                class="host-icon-btn-icon"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <path
                                    d="M512 426.666667c-46.933333 0-85.333333 38.4-85.333333 85.333333s38.4 85.333333 85.333333 85.333333 85.333333-38.4 85.333333-85.333333-38.4-85.333333-85.333333-85.333333z m298.666667-298.666667H213.333333a85.333333 85.333333 0 0 0-85.333333 85.333333v597.333334a85.333333 85.333333 0 0 0 85.333333 85.333333h597.333334a85.333333 85.333333 0 0 0 85.333333-85.333333V213.333333a85.333333 85.333333 0 0 0-85.333333-85.333333z m-74.666667 384c0 9.813333-0.853333 19.626667-2.133333 29.013333l63.146666 49.493334c5.546667 4.693333 7.253333 12.8 3.413334 19.2l-59.733334 103.253333c-3.84 6.4-11.52 8.96-18.346666 6.4l-74.24-29.866667c-15.36 11.946667-32.426667 21.76-50.346667 29.44l-11.093333 78.933334c-1.28 7.253333-7.68 12.8-14.933334 12.8h-119.466666c-7.253333 0-13.653333-5.546667-14.933334-12.373334l-11.093333-78.933333c-18.346667-7.68-34.986667-17.493333-50.346667-29.44l-74.24 29.866667c-6.826667 2.56-14.506667 0-18.346666-6.4l-59.733334-103.253334a15.061333 15.061333 0 0 1 3.413334-19.2l63.146666-49.493333c-1.28-9.813333-2.133333-19.626667-2.133333-29.44 0-9.813333 0.853333-19.626667 2.133333-29.013333l-63.146666-49.493334a15.061333 15.061333 0 0 1-3.413334-19.2l59.733334-103.253333c3.84-6.4 11.52-8.96 18.346666-6.4l74.24 29.866667c15.36-11.946667 32.426667-21.76 50.346667-29.44l11.093333-78.933334c1.28-7.253333 7.68-12.8 14.933334-12.8h119.466666c7.253333 0 13.653333 5.546667 14.933334 12.373334l11.093333 78.933333c18.346667 7.68 34.986667 17.493333 50.346667 29.44l74.24-29.866667c6.826667-2.56 14.506667 0 18.346666 6.4l59.733334 103.253334c3.84 6.4 2.133333 14.506667-3.413334 19.2l-63.146666 49.493333c1.28 9.813333 2.133333 19.626667 2.133333 29.44z"
                                    fill="currentColor"
                                ></path>
                            </svg>
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
                                        <svg
                                            class="host-logout-btn-icon"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                            ></path>
                                        </svg>
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
                            @submit="sendText"
                        />
                    </div>
                    <div class="host-mobile-card">
                        <UploadPanel
                            compact
                            :queue-items="props.queueItems"
                            @retry="retryUpload"
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
    </div>
</template>
