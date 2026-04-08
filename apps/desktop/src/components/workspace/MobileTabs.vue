<script setup lang="ts">
import SendIcon from "../../assets/icons/send.svg";
import ClockIcon from "../../assets/icons/clock.svg";

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
      <SendIcon class="mobile-tab-icon" />
      <span class="mobile-tab-label">发送</span>
    </button>
    <button data-tab="items" class="mobile-tab-btn" :class="props.activeTab === 'items' ? 'mobile-tab-btn--active' : 'mobile-tab-btn--inactive'" @click="switchTab('items')">
      <ClockIcon class="mobile-tab-icon" />
      <span class="mobile-tab-label">条目</span>
    </button>
  </nav>
</template>
