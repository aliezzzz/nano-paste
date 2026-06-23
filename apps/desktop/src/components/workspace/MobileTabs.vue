<script setup lang="ts">
import SendIcon from "../../assets/icons/send.svg";
import ClockIcon from "../../assets/icons/clock.svg";
import StarIcon from "../../assets/icons/star.svg";

export type MobileTab = "send" | "items" | "favorites";

const props = withDefaults(defineProps<{ activeTab?: MobileTab }>(), {
  activeTab: "send",
});

const emit = defineEmits<{
  (e: "switch", tab: MobileTab): void;
}>();

function switchTab(tab: MobileTab): void {
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
      <span class="mobile-tab-label">历史</span>
    </button>
    <button data-tab="favorites" class="mobile-tab-btn" :class="props.activeTab === 'favorites' ? 'mobile-tab-btn--active' : 'mobile-tab-btn--inactive'" @click="switchTab('favorites')">
      <StarIcon class="mobile-tab-icon" />
      <span class="mobile-tab-label">收藏</span>
    </button>
  </nav>
</template>
