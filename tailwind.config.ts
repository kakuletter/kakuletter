import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Noto Sans JP",
          "Hiragino Sans",
          "Meiryo",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#fdf8f6",
          100: "#f9ede8",
          200: "#f3d5c8",
          500: "#c0392b",
          600: "#a93226",
          700: "#922b21",
        },
      },
    },
  },
  plugins: [],
};
export default config;
