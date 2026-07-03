import { defineStore } from "pinia";
import type { MobileTab } from "../components/workspace/MobileTabs.vue";

const WORKSPACE_UI_STORAGE_KEY = "nanopaste.desktop.workspace-ui";

export const useWorkspaceUiStore = defineStore("workspace-ui", {
  state: () => ({
    mobileTab: "send" as MobileTab,
  }),
  actions: {
    setMobileTab(tab: MobileTab): void {
      this.mobileTab = tab;
    },
    reset(): void {
      this.mobileTab = "send";
    },
  },
  persist: {
    key: WORKSPACE_UI_STORAGE_KEY,
    storage: localStorage,
  },
});
