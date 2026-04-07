<script setup lang="ts">
import { computed, watch } from "vue";
import WorkspaceHost from "../components/WorkspaceHost.vue";
import DeviceManagerModal from "../components/modals/DeviceManagerModal.vue";
import { useBridgeWorkspace } from "../composables/useBridgeWorkspace";
import { useDeviceManagerModal } from "../composables/useDeviceManagerModal";
import { useGlobalPaste } from "../composables/useGlobalPaste";
import { getAuthSession } from "../stores/auth";
import type { ItemActionPayload } from "../types/workspace";

const emit = defineEmits<{
  (e: "logged-out"): void;
  (e: "open-config"): void;
}>();

const props = defineProps<{ isAuthenticated: boolean }>();

const {
  queueItems,
  items,
  itemsLoading,
  activeDevices,
  sendingText,
  connectionStatus,
  startWorkspace,
  logout,
  handleSendText,
  handleUploadFiles,
  handleRetryUpload,
  handleClearFinishedUpload,
  handleItemAction,
  handleRefreshItems,
} = useBridgeWorkspace(() => emit("logged-out"));

const { deviceModalOpen, devicesLoading, devicesError, devices, revokeConfirmDeviceId, revokingDeviceId, getCurrentDeviceId, openDeviceManager, closeDeviceManager, askRevokeDevice, cancelRevokeDevice, confirmRevokeDevice, formatDeviceTime } = useDeviceManagerModal();

const currentUsername = computed(() => getAuthSession().username);

useGlobalPaste();

watch(
  () => props.isAuthenticated,
  async (authenticated) => {
    if (authenticated) {
      await startWorkspace();
    }
  },
  { immediate: true },
);

async function handleItemActionWrapper(payload: ItemActionPayload): Promise<void> {
  await handleItemAction(payload);
}
</script>

<template>
  <div class="workspace-page">
    <WorkspaceHost
      :queue-items="queueItems"
      :items="items"
      :items-loading="itemsLoading"
      :active-devices="activeDevices"
      :sending-text="sendingText"
      :connection-status="connectionStatus"
      :username="currentUsername"
      @open-config="emit('open-config')"
      @open-device-manager="openDeviceManager"
      @logout="logout"
      @send-text="handleSendText"
      @upload-files="handleUploadFiles"
      @retry-upload="handleRetryUpload"
      @clear-finished-upload="handleClearFinishedUpload"
      @item-action="handleItemActionWrapper"
      @refresh-items="handleRefreshItems"
    />

    <DeviceManagerModal
      v-if="deviceModalOpen"
      :loading="devicesLoading"
      :error="devicesError"
      :devices="devices"
      :revoke-confirm-device-id="revokeConfirmDeviceId"
      :revoking-device-id="revokingDeviceId"
      :get-current-device-id="getCurrentDeviceId"
      :format-device-time="formatDeviceTime"
      @close="closeDeviceManager"
      @ask-revoke="askRevokeDevice"
      @cancel-revoke="cancelRevokeDevice"
      @confirm-revoke="confirmRevokeDevice"
    />
  </div>
</template>
