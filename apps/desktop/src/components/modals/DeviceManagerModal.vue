<script setup lang="ts">
import type { DeviceInfo } from "../../../../../packages/contracts/v1";

const props = defineProps<{
  loading: boolean;
  error: string;
  devices: DeviceInfo[];
  revokeConfirmDeviceId: string;
  revokingDeviceId: string;
  getCurrentDeviceId: () => string;
  formatDeviceTime: (timestamp: string) => string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "ask-revoke", deviceId: string): void;
  (e: "cancel-revoke"): void;
  (e: "confirm-revoke", deviceId: string): void;
}>();
</script>

<template>
  <div class="app-modal-wrap app-modal-wrap--device">
    <div class="app-modal-backdrop" @click="emit('close')"></div>
    <div class="app-modal-center">
      <div class="app-modal-card app-modal-card--device">
        <div class="app-modal-header">
          <div>
            <h3 class="app-modal-title">设备管理</h3>
            <p class="app-modal-subtitle">可下线异常设备，当前设备不可下线</p>
          </div>
          <button type="button" class="app-modal-close-btn" @click="emit('close')">✕</button>
        </div>

        <div class="app-device-modal-content custom-scrollbar">
          <div v-if="props.loading" class="app-device-modal-state">加载中...</div>
          <div v-else-if="props.error" class="app-device-modal-state app-device-modal-state--error">{{ props.error }}</div>
          <div v-else-if="props.devices.length === 0" class="app-device-modal-state">暂无设备数据</div>
          <div v-else>
            <div v-for="device in props.devices" :key="device.deviceId" class="app-device-card">
              <div class="app-device-card-row">
                <div class="app-device-card-info">
                  <p class="app-device-card-name">{{ device.deviceName || '未命名设备' }}</p>
                  <p class="app-device-card-meta">{{ device.platform }} · 最近在线 {{ props.formatDeviceTime(device.lastSeenAt) }}</p>
                </div>

                <div v-if="device.deviceId === props.getCurrentDeviceId()" class="app-device-tag app-device-tag--current">当前设备</div>
                <div v-else-if="device.revokedAt" class="app-device-tag app-device-tag--revoked">已下线</div>
                <div v-else-if="props.revokeConfirmDeviceId === device.deviceId" class="app-device-actions-confirm">
                  <button
                    type="button"
                    class="app-device-confirm-btn"
                    :class="props.revokingDeviceId === device.deviceId ? 'app-btn-disabled' : ''"
                    @click="emit('confirm-revoke', device.deviceId)"
                  >
                    {{ props.revokingDeviceId === device.deviceId ? '处理中...' : '确认下线' }}
                  </button>
                  <button
                    type="button"
                    class="app-device-cancel-btn"
                    :class="props.revokingDeviceId === device.deviceId ? 'app-btn-disabled' : ''"
                    @click="emit('cancel-revoke')"
                  >取消</button>
                </div>
                <button v-else type="button" class="app-device-revoke-btn" @click="emit('ask-revoke', device.deviceId)">
                  下线
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
