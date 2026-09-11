import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          x: "#1d4ed8",
          o: "#b91c1c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
