import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { vault: { black: "#030706", panel: "#07110f", green: "#67ff6a", teal: "#20f6d2" } },
      boxShadow: { glow: "0 0 40px rgba(32, 246, 210, 0.18)" }
    }
  },
  plugins: []
};

export default config;
