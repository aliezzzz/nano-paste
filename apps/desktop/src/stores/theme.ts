import { defineStore } from "pinia";
import { ref, watch } from "vue";

export const useThemeStore = defineStore(
  "theme",
  () => {
    const theme = ref<"light" | "dark">("dark");

    function toggleTheme() {
      theme.value = theme.value === "light" ? "dark" : "light";
    }

    function setTheme(newTheme: "light" | "dark") {
      theme.value = newTheme;
    }

    // Apply theme to document
    watch(
      theme,
      (val) => {
        if (typeof document !== "undefined") {
          const html = document.documentElement;
          if (val === "dark") {
            html.classList.add("dark");
            html.classList.remove("light");
          } else {
            html.classList.add("light");
            html.classList.remove("dark");
          }
        }
      },
      { immediate: true },
    );

    return {
      theme,
      toggleTheme,
      setTheme,
    };
  },
  {
    persist: true,
  },
);
