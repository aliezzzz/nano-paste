import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import svgLoader from "vite-svg-loader";

export default defineConfig({
  plugins: [vue(), UnoCSS(), svgLoader()],
  clearScreen: false,
  base: './',
  server: {
    port: 1420,
    strictPort: true,
    host: "127.0.0.1"
  }
});
