import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0a0f',
        'bg-card': 'rgba(18, 18, 26, 0.95)',
        'bg-elevated': '#1a1a24',
        'accent-blue': '#3b82f6',
        'accent-cyan': '#06b6d4',
        'accent-green': '#10b981',
        'accent-orange': '#f59e0b',
        'accent-red': '#ef4444',
        'accent-violet': '#8b5cf6',
        'accent-amber': '#f59e0b',
      },
    },
  },
  plugins: [],
} satisfies Config
