import { ref } from "vue";
import { listDevices, revokeDevice } from "../api/devices";
import { useAuthStore } from "../stores/auth";
import { showToast } from "../components/feedback/toast";
import type { DeviceInfo } from "../../../../packages/contracts/v1";

export function useDeviceManagerModal() {
  const deviceModalOpen = ref(false);
  const devicesLoading = ref(false);
  const devicesError = ref("");
  const devices = ref<DeviceInfo[]>([]);
  const revokeConfirmDeviceId = ref("");
  const revokingDeviceId = ref("");

  const authStore = useAuthStore();

  async function openDeviceManager(): Promise<void> {
    deviceModalOpen.value = true;
    revokeConfirmDeviceId.value = "";
    await loadDevices();
  }

  function closeDeviceManager(): void {
    deviceModalOpen.value = false;
    revokeConfirmDeviceId.value = "";
  }

  async function loadDevices(): Promise<void> {
    try {
      devicesLoading.value = true;
      devicesError.value = "";
      devices.value = await listDevices();
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
    if (deviceId === authStore.deviceId) {
      showToast("当前设备不能下线", "error");
      return;
    }
    try {
      revokingDeviceId.value = deviceId;
      await revokeDevice(deviceId);
      showToast("设备已下线", "success");
      revokeConfirmDeviceId.value = "";
      await loadDevices();
    } catch (error) {
      showToast(`下线失败: ${error instanceof Error ? error.message : "下线设备失败"}`, "error");
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

  return {
    deviceModalOpen,
    devicesLoading,
    devicesError,
    devices,
    revokeConfirmDeviceId,
    revokingDeviceId,
    openDeviceManager,
    closeDeviceManager,
    askRevokeDevice,
    cancelRevokeDevice,
    confirmRevokeDevice,
    formatDeviceTime,
  };
}
