import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sentinel: {
          dark: "#0f172a", // slate-900
          darker: "#020617", // slate-950
          primary: "#2dd4bf", // teal-400
          secondary: "#38bdf8", // sky-400
          danger: "#f43f5e", // rose-500
          success: "#10b981", // emerald-500
          warning: "#eab308", // yellow-500
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
