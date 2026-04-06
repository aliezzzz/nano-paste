<script setup lang="ts">
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
  <nav class="mobile-tabs-nav">
    <button data-tab="send" class="mobile-tab-btn" :class="props.activeTab === 'send' ? 'mobile-tab-btn--active' : 'mobile-tab-btn--inactive'" @click="switchTab('send')">
      <svg class="mobile-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
      </svg>
      <span class="mobile-tab-label">发送</span>
    </button>
    <button data-tab="items" class="mobile-tab-btn" :class="props.activeTab === 'items' ? 'mobile-tab-btn--active' : 'mobile-tab-btn--inactive'" @click="switchTab('items')">
      <svg class="mobile-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span class="mobile-tab-label">条目</span>
    </button>
  </nav>
</template>
