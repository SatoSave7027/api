import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#04060a",
          900: "#070b12",
          800: "#0c1117",
          700: "#121922",
          600: "#1a2330",
        },
        neon: {
          400: "#5dffaa",
          500: "#39ff88",
          600: "#1fe676",
        },
        aqua: {
          400: "#5ce8ff",
          500: "#22d3ee",
          600: "#0aa5c0",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(57, 255, 136, 0.25), 0 10px 40px -10px rgba(34, 211, 238, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
