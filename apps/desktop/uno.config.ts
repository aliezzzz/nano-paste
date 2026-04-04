import { defineConfig, presetUno } from "unocss";
import presetWind from "@unocss/preset-wind";

export default defineConfig({
  presets: [presetUno(), presetWind()],
  content: {
    pipeline: {
      include: [/\.(vue|html|ts)$/],
    },
  },
});
