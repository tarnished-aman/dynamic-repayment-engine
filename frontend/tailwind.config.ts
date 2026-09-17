import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        // Dark theme remapping for existing component tokens
        ink: {
          DEFAULT: "#fafafa", // was #1b2430 (dark text) → now light text
          muted: "#a1a1aa", // was #5c6570 → zinc-400
        },
        paper: {
          DEFAULT: "#18181b", // was #f4efe6 (light bg) → zinc-900
          raised: "#27272a", // was #fbf8f2 → zinc-800
        },
        teal: {
          DEFAULT: "#10b981", // was #0f5f56 → emerald-500
          soft: "#064e3b", // was #d7ece8 → emerald-900
        },
        clay: {
          DEFAULT: "#f97316", // was #c45c26 → orange-500
          soft: "#7c2d12", // was #f4ddd0 → orange-900
        },
        gold: {
          DEFAULT: "#eab308", // was #b0892a → yellow-500
          soft: "#713f12", // was #f3e6c4 → yellow-900
        },
      },
      boxShadow: {
        card: "0 1px 0 rgba(255, 255, 255, 0.05), 0 12px 32px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
