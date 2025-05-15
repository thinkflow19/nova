/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        background: {
          light: '#ffffff',  // Changed to white for light mode
          DEFAULT: '#ffffff', // Changed to white for light mode
          dark: '#343541',   // Dark background similar to ChatGPT
        },
        text: {
          light: '#111827',  // Dark text for light mode
          DEFAULT: '#111827', // Dark text for light mode
          dark: '#ececf1',   // Light text for dark mode
        },
        primary: '#0055FF',
        'primary-dark': '#0044CC',
        brand: '#0070f3',
        // Message bubble colors
        'user-bubble-light': '#f9f9f9', // Light gray for user bubble
        'user-bubble-dark': '#4a4a4a', // Darker gray for user bubble in dark mode
        'assistant-bubble-light': '#ffffff', // White for assistant bubble
        'assistant-bubble-dark': '#444654', // Dark gray for assistant bubble in dark mode
        'border-light': '#e5e5e5',
        'border-dark': '#565869',
        mint: '#00F5A0',
        cyan: '#00D9F5',
        lavender: '#B4A5FF',
      },
      borderRadius: {
        'lg': '0.5rem',
      },
      transitionDuration: {
        '250': '250ms',
      },
      animation: {
        'spin': 'spin 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite', // Add slower spin animation
        'fade': 'fadeIn 200ms ease-in',
        'fade-in': 'fadeIn 200ms ease-in', // Add fade-in animation (alias)
        'slide': 'slideIn 200ms ease-in',
      },
      keyframes: {
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // Add typography plugin
  ],
} 