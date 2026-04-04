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
  <nav class="fixed bottom-0 left-0 right-0 h-16 border-t border-slate-800/50 bg-slate-900/90 flex items-center justify-around z-50">
    <button data-tab="send" class="mobile-tab-btn flex flex-col items-center gap-1 py-2 px-6 transition-colors" :class="props.activeTab === 'send' ? 'active text-violet-400' : 'text-slate-400'" @click="switchTab('send')">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
      </svg>
      <span class="text-xs font-medium">发送</span>
    </button>
    <button data-tab="items" class="mobile-tab-btn flex flex-col items-center gap-1 py-2 px-6 transition-colors" :class="props.activeTab === 'items' ? 'active text-violet-400' : 'text-slate-400'" @click="switchTab('items')">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span class="text-xs font-medium">条目</span>
    </button>
  </nav>
</template>
