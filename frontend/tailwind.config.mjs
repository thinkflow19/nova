import defaultTheme from "tailwindcss/defaultTheme";
import colors from "tailwindcss/colors";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  safelist: [
    "rounded-xl", "text-gray-500", "bg-gray-100", "text-gray-900",
    "bg-white", "shadow-sm", "shadow-md", "p-6", "px-6", "py-20"
  ],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        ...colors,
        primary: "#5f5fff",
        "primary-dark": "#4f4fff",
        mint: "#7effdb",
        cyan: "#00e0ff",
        lavender: "#f6f6fb",
        "off-white": "#fdfcff",
        "gray-dark": "#1f1f1f",
        "text-muted": "#6b7280",
        "gradient-purple": "#ad63ff",
      },
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        display: ["Satoshi", "Inter", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [animate],
}; 