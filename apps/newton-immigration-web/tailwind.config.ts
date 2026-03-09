import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        newton: {
          red: "#E53935",
          dark: "#1F1F1F",
          bg: "#F5F5F5",
          accent: "#C62828"
        }
      },
      boxShadow: {
        glass: "0 8px 30px rgba(31, 31, 31, 0.12)"
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(circle at 20% 20%, rgba(229, 57, 53, 0.18), transparent 50%), radial-gradient(circle at 80% 0%, rgba(198, 40, 40, 0.18), transparent 45%), linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)"
      }
    }
  },
  plugins: []
};

export default config;
