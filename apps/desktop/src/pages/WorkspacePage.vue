<script setup lang="ts">
import { computed, watch } from "vue";
import WorkspaceHost from "../components/WorkspaceHost.vue";
import DeviceManagerModal from "../components/modals/DeviceManagerModal.vue";
import { useBridge } from "../composables/useBridge";
import { useDeviceManagerModal } from "../composables/useDeviceManagerModal";
import { useGlobalPaste } from "../composables/useGlobalPaste";
import { useAuthStore } from "../stores/auth";
import type { ItemActionPayload } from "../types/workspace";

const emit = defineEmits<{
  (e: "logged-out"): void;
  (e: "open-config"): void;
}>();

const props = defineProps<{ isAuthenticated: boolean }>();

const bridge = useBridge(() => emit("logged-out"));
const deviceManager = useDeviceManagerModal();
const authStore = useAuthStore();

useGlobalPaste(() => emit("logged-out"));

const currentUsername = computed(() => authStore.username);

watch(
  () => props.isAuthenticated,
  async (authenticated) => {
    if (authenticated) {
      bridge.initialize();
    }
  },
  { immediate: true },
);

async function handleItemActionWrapper(payload: ItemActionPayload): Promise<void> {
  await bridge.executeItemAction(payload);
}
</script>

<template>
  <div class="workspace-page">
    <WorkspaceHost
      :queue-items="bridge.queueItems.value"
      :items="bridge.items.value"
      :items-loading="bridge.itemsLoading.value"
      :active-devices="bridge.activeDevices.value"
      :sending-text="bridge.sendingText.value"
      :username="currentUsername"
      @open-config="emit('open-config')"
      @open-device-manager="deviceManager.openDeviceManager"
      @logout="bridge.logout"
      @send-text="bridge.sendTextItem"
      @upload-files="bridge.uploadFiles"
      @retry-upload="bridge.retryUpload"
      @clear-finished-upload="bridge.clearFinishedUploads"
      @item-action="handleItemActionWrapper"
      @refresh-items="bridge.loadItems"
    />

    <DeviceManagerModal
      v-if="deviceManager.deviceModalOpen.value"
      :loading="deviceManager.devicesLoading.value"
      :error="deviceManager.devicesError.value"
      :devices="deviceManager.devices.value"
      :revoke-confirm-device-id="deviceManager.revokeConfirmDeviceId.value"
      :revoking-device-id="deviceManager.revokingDeviceId.value"
      :get-current-device-id="() => bridge.currentDeviceId.value"
      :format-device-time="deviceManager.formatDeviceTime"
      @close="deviceManager.closeDeviceManager"
      @ask-revoke="deviceManager.askRevokeDevice"
      @cancel-revoke="deviceManager.cancelRevokeDevice"
      @confirm-revoke="deviceManager.confirmRevokeDevice"
    />
  </div>
</template>
