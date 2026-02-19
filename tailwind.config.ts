import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // The * wildcard here is crucial. It forces Tailwind to find files in src.
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        floral: {
          magenta: "#C2185B", // Deep Pink buttons
          light: "#FCE4EC",   // Light Pink bg
          green: "#4CAF50",   // "Anytime" Badge
          orange: "#FF9800",  // "24hr" Badge
          dark: "#333333",    // Dark Text
          gray: "#f9f9f9"     // Background
        },
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
        sans: ["Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;