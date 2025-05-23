/** @type {import('tailwindcss').Config} */
const { heroui } = require("@heroui/react");
const path = require("path");
const { themes, layout } = require(path.join(__dirname, "src/theme/themeConfig.js"));

module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'theme-primary': 'rgb(var(--theme-primary))',
        'theme-accent': 'rgb(var(--theme-accent))',
        'bg-main': 'rgb(var(--bg-main))',
        'bg-panel': 'rgb(var(--bg-panel))',
        'text-primary': 'rgb(var(--text-primary))',
        'text-muted': 'rgb(var(--text-muted))',
        'border': 'rgb(var(--border))',
        'hover-glass': 'rgba(0,0,0,0.03)',
        'dark-hover-glass': 'rgba(255,255,255,0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        heading: ['Outfit', 'ui-sans-serif', 'system-ui'],
      },
      animation: {
        'slide-up': 'slide-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(var(--theme-primary-rgb), 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(var(--theme-primary-rgb), 0.7)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.1)',
        'glass-hover': '0 12px 40px rgba(0,0,0,0.15)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'dots': 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
      },
      ringColor: {
        'theme-primary': 'rgb(var(--theme-primary))',
      },
      borderColor: {
        'theme-primary': 'rgb(var(--theme-primary))',
      },
    },
  },
  plugins: [
    heroui({
      themes: themes,
      layout: layout,
      defaultTheme: "light",
      defaultExtendTheme: "light"
    }),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};