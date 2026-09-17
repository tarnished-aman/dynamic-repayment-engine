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
        ink: {
          DEFAULT: "#1b2430",
          muted: "#5c6570",
        },
        paper: {
          DEFAULT: "#f4efe6",
          raised: "#fbf8f2",
        },
        teal: {
          DEFAULT: "#0f5f56",
          soft: "#d7ece8",
        },
        clay: {
          DEFAULT: "#c45c26",
          soft: "#f4ddd0",
        },
        gold: {
          DEFAULT: "#b0892a",
          soft: "#f3e6c4",
        },
      },
      boxShadow: {
        card: "0 1px 0 rgba(27, 36, 48, 0.04), 0 12px 32px rgba(27, 36, 48, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
