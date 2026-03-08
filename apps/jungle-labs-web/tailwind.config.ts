import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        jungle: {
          black: "#04070d",
          cyan: "#38bdf8",
          neon: "#34d399",
          deep: "#081123"
        }
      }
    }
  },
  plugins: []
};

export default config;
