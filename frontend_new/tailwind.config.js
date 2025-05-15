/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
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
        // Theme-agnostic names mapping to CSS variables
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))', // For general borders, ensure --border is defined
        input: 'hsl(var(--input))',   // For input backgrounds/borders
        ring: 'hsl(var(--ring))',     // For focus rings

        // Dark Mode (default) - specific names
        'bg-main': 'hsl(var(--bg-main))', // Use hsl for consistency if variables are HSL
        'bg-panel': 'hsl(var(--bg-panel))',
        'text-main': 'hsl(var(--text-main))',
        'text-muted': 'hsl(var(--text-muted))',
        'border-color': 'hsl(var(--border-color))', // This was 'rgba(var(--border-color-rgb), 0.08)'
        'hover-glass': 'hsl(var(--hover-glass))',   // This was 'rgba(var(--hover-glass-rgb), 0.04)'
        'error-color': 'hsl(var(--error-color))',   // This was '#ff6b6b'

        primary: {
          DEFAULT: "hsl(var(--primary-hsl))", // Using HSL variable
          foreground: "hsl(var(--primary-foreground-hsl))", // Using HSL variable
          hover: "hsl(var(--primary-hover-hsl))", // Add if you have a --primary-hover-hsl
        },
        secondary: {
          DEFAULT: "hsl(var(--card))", // bg-panel
          foreground: "hsl(var(--card-foreground))", // text-main
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))", // Corresponds to bg-panel or similar
          foreground: "#94a3b8", // text-muted
        },
        accent: {
          DEFAULT: "#00bfa6", // primary color
          foreground: "#ffffff", // text on accent
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "#1c1d1f", // bg-panel
          foreground: "#e0e0e0", // text-main
        },
        // Light Mode overrides will be handled by CSS variables in globals.css or direct class usage
        // For direct usage in Tailwind with light: prefix (if not using CSS vars for all)
        // Consider removing these if all light mode is handled by CSS vars and html.light
        'light-bg-main': 'hsl(var(--light-bg-main))', // Ensure --light-bg-main is defined
        'light-bg-panel': 'hsl(var(--light-bg-panel))',
        'light-text-main': 'hsl(var(--light-text-main))',
        'light-text-muted': 'hsl(var(--light-text-muted))',
        'light-border-color': 'hsl(var(--light-border-color))',
        'light-primary': 'hsl(var(--primary-hsl))', // primary is the same
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        '2xl': '1rem', // Added from meta-prompt for containers
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
      boxShadow: {
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // Default xl
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // Default 2xl
        // Custom shadows based on meta-prompt, can be used directly or via @apply
        'mp-xl': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', // example, adjust as needed
        'mp-2xl': '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', // example
      }
    },
  },
  plugins: [require("tailwindcss-animate"), require('@tailwindcss/typography')],
}; 