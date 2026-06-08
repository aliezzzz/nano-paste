import { defineStore } from "pinia";

export interface UndoAction {
  id: string;
  label: string;
  createdAt: number;
}

export const useUndoStore = defineStore("undo", {
  state: () => ({
    lastAction: null as UndoAction | null,
  }),
  actions: {
    push(label: string): void {
      this.lastAction = {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        label,
        createdAt: Date.now(),
      };
    },
    clear(): void {
      this.lastAction = null;
    },
  },
});
