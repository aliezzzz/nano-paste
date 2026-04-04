import { defineConfig, presetUno } from "unocss";
import presetWind from "@unocss/preset-wind";

export default defineConfig({
  presets: [presetUno(), presetWind()],
  content: {
    pipeline: {
      include: [/\.(vue|html|ts)$/],
    },
  },
  safelist: [
    "bg-violet-600",
    "bg-violet-500",
    "text-violet-400",
    "border-violet-500/30",
    "shadow-violet-500/30",
    "bg-amber-600",
    "bg-amber-500",
    "text-amber-400",
    "border-amber-500/30",
    "shadow-amber-500/30",
  ],
});
