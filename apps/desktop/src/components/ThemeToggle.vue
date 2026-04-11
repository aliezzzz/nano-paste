<script setup lang="ts">
import { useThemeStore } from "../stores/theme";
import SunIcon from "../assets/icons/tray-template.svg"; // Fallback if moon not exists, or I can use a custom SVG

const themeStore = useThemeStore();

function toggle() {
  themeStore.toggleTheme();
}
</script>

<template>
  <button
    class="theme-toggle"
    @click="toggle"
    :title="themeStore.theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
  >
    <div class="icon-wrapper" :class="themeStore.theme">
      <!-- Sun -->
      <svg
        v-if="themeStore.theme === 'light'"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="sun-icon"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
      <!-- Moon -->
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="moon-icon"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    </div>
  </button>
</template>

<style scoped>
.theme-toggle {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1.5px solid var(--border-soft);
  color: var(--text-main);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  position: relative;
}

.theme-toggle:hover {
  border-color: var(--text-accent);
  transform: translateY(-1px);
}

.theme-toggle:active {
  transform: translateY(0);
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.icon-wrapper.light {
  animation: rotate-in 0.5s ease-out;
}

.icon-wrapper.dark {
  animation: scale-in 0.5s ease-out;
}

@keyframes rotate-in {
  from {
    transform: rotate(-90deg) scale(0);
    opacity: 0;
  }
  to {
    transform: rotate(0) scale(1);
    opacity: 1;
  }
}

@keyframes scale-in {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.sun-icon {
  color: #d4a017; /* Amber sun */
}

.moon-icon {
  color: #7c89ff; /* Soft violet moon */
}
</style>
