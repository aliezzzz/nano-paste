<script setup lang="ts">
import { computed, ref } from "vue";
import SendPanel from "./workspace/SendPanel.vue";
import UploadPanel from "./workspace/UploadPanel.vue";
import ItemsPanel from "./workspace/ItemsPanel.vue";
import MobileTabs from "./workspace/MobileTabs.vue";
import trayTemplateIcon from "../assets/icons/tray-template.svg?url";
import chevronDownIcon from "../assets/icons/chevron-down.svg?url";
import settingsIcon from "../assets/icons/settings.svg?url";
import logoutIcon from "../assets/icons/logout.svg?url";
import type { UploadQueueViewItem } from "./workspace/UploadPanel.vue";
import type { ItemView, ActiveDeviceView, ItemActionPayload, RealtimeStatus } from "../types/workspace";

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
    (e: "item-action", payload: ItemActionPayload): void;
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

function itemAction(payload: ItemActionPayload): void {
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
                                <img
                                    :src="chevronDownIcon"
                                    class="host-device-count-icon"
                                    alt=""
                                >
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
                        <img
                            :src="settingsIcon"
                            class="host-icon-btn-icon"
                            aria-hidden="true"
                            alt=""
                        >
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
                                    <img
                                        :src="logoutIcon"
                                        class="host-logout-btn-icon"
                                        alt=""
                                    >
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
                            <img
                                :src="settingsIcon"
                                class="host-icon-btn-icon"
                                aria-hidden="true"
                                alt=""
                            >
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
                                        <img
                                            :src="logoutIcon"
                                            class="host-logout-btn-icon"
                                            alt=""
                                        >
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
