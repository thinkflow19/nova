/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
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
        'bg-main': 'var(--color-bg-main)',
        'bg-panel': 'var(--color-bg-panel)',
        'text-primary': 'var(--color-text-primary)',
        'text-muted': 'var(--color-text-muted)',
        'border-color': 'var(--color-border)',
        'hover-glass': 'var(--color-hover-glass)',
        'theme-primary': 'var(--theme-primary)',
        'theme-accent': 'var(--theme-accent)',
        teal: {
          primary: '#00bfa6',
          accent: '#2dd4bf',
        },
        amber: {
          primary: '#f7b801',
          accent: '#facc15',
        },
        indigo: {
          primary: '#5e60ce',
          accent: '#818cf8',
        },
        coral: {
          primary: '#ff6b6b',
          accent: '#fb7185',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'xl': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        '2xl': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0,0,0,0.03)',
        'custom-glow': '0 4px 12px rgba(0,0,0,0.2)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      ringWidth: {
        '1': '1px',
      },
      ringColor: ({ theme }) => ({
        ...theme('colors'),
        DEFAULT: theme('colors.theme-primary', 'currentColor'),
      }),
      backdropBlur: {
        md: '12px',
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-inter)", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fadeIn": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.8 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fadeIn": "fadeIn 0.5s ease-in-out",
        "pulse-slow": "pulse-slow 2s infinite",
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'hsl(var(--foreground))',
            a: {
              color: 'hsl(var(--accent))',
              '&:hover': {
                color: 'hsl(var(--accent))',
                opacity: 0.8,
              },
            },
            code: {
              color: 'hsl(var(--accent))',
              backgroundColor: 'hsl(var(--secondary) / 0.6)',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': {
              content: 'none',
            },
            'code::after': {
              content: 'none',
            },
            p: {
              marginBottom: '1rem',
            },
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require('@tailwindcss/typography')],
}; 