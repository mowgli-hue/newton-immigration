import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        newton: {
          red: "#E53935",
          dark: "#E8EEF9",
          ink: "#111722",
          bg: "#0B0F17",
          panel: "#151C2A",
          accent: "#C62828"
        }
      },
      boxShadow: {
        glass: "0 20px 60px rgba(0, 0, 0, 0.45)"
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(circle at 15% 15%, rgba(229, 57, 53, 0.28), transparent 45%), radial-gradient(circle at 88% 5%, rgba(198, 40, 40, 0.24), transparent 40%), linear-gradient(140deg, #0b0f17 0%, #151c2a 50%, #0e1320 100%)"
      }
    }
  },
  plugins: []
};

export default config;
