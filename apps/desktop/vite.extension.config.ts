import { mkdir, copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import svgLoader from "vite-svg-loader";

function copyExtensionAssetsPlugin(): Plugin {
  return {
    name: "copy-extension-assets",
    async closeBundle() {
      const outputDir = resolve(__dirname, "dist-extension");
      const manifestSource = resolve(__dirname, "extension/manifest.json");
      const iconSource = resolve(__dirname, "../../nanoPaste.png");
      const manifestTarget = resolve(outputDir, "manifest.json");
      const iconTarget = resolve(outputDir, "icon.png");

      await mkdir(outputDir, { recursive: true });
      await copyFile(manifestSource, manifestTarget);
      await copyFile(iconSource, iconTarget);
    },
  };
}

export default defineConfig({
  plugins: [vue(), UnoCSS(), svgLoader(), copyExtensionAssetsPlugin()],
  clearScreen: false,
  base: "./",
  build: {
    outDir: "dist-extension",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        background: resolve(__dirname, "extension/background.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") {
            return "background.js";
          }
          return "assets/[name].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
