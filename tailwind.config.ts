import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0b1f3a",
          blue: "#163b66",
          green: "#16a34a",
          mint: "#dcfce7",
          line: "#d8e1ec",
          surface: "#f4f7fb"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(11, 31, 58, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
