import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: "#060b09",
          panel: "#101917",
          lime: "#89ff2c",
          cyan: "#22e6d6",
          text: "#d9ffe0"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(137, 255, 44, 0.35), 0 0 30px rgba(34, 230, 214, 0.15)"
      }
    }
  },
  plugins: []
};

export default config;
