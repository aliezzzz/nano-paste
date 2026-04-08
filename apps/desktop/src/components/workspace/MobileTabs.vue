<script setup lang="ts">
import sendIcon from "../../assets/icons/send.svg?url";
import clockIcon from "../../assets/icons/clock.svg?url";

const props = withDefaults(defineProps<{ activeTab?: "send" | "items" }>(), {
  activeTab: "send",
});

const emit = defineEmits<{
  (e: "switch", tab: "send" | "items"): void;
}>();

function switchTab(tab: "send" | "items"): void {
  emit("switch", tab);
}
</script>

<template>
  <nav class="mobile-tabs-nav safe-bottom">
    <button data-tab="send" class="mobile-tab-btn" :class="props.activeTab === 'send' ? 'mobile-tab-btn--active' : 'mobile-tab-btn--inactive'" @click="switchTab('send')">
      <img :src="sendIcon" class="mobile-tab-icon" alt="">
      <span class="mobile-tab-label">发送</span>
    </button>
    <button data-tab="items" class="mobile-tab-btn" :class="props.activeTab === 'items' ? 'mobile-tab-btn--active' : 'mobile-tab-btn--inactive'" @click="switchTab('items')">
      <img :src="clockIcon" class="mobile-tab-icon" alt="">
      <span class="mobile-tab-label">条目</span>
    </button>
  </nav>
</template>
