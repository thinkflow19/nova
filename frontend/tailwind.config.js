/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          light: '#f9fafb',  // Very light gray as specified in style guide
          DEFAULT: '#f9fafb'
        },
        text: {
          DEFAULT: '#111827', // Dark gray as specified in style guide
        },
        primary: 'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        brand: '#0070f3'  // Add brand color
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
  plugins: [],
} 