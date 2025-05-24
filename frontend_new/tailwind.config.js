/** @type {import('tailwindcss').Config} */
const { heroui } = require("@heroui/react");
const path = require("path");

const { defaultTheme: novaThemeDetails } = require(path.join(__dirname, "src/theme/themeConfig.js"));

const FONT_SANS_STRING = novaThemeDetails.fonts.sans;
const FONT_SERIF_STRING = novaThemeDetails.fonts.serif;
const FONT_MONO_STRING = novaThemeDetails.fonts.mono;

// Helper function to create HSL CSS variable strings for Tailwind
const createHslColorVariable = (name) => `hsl(var(${name}) / <alpha-value>)`;

// Prepare colors for Tailwind by mapping CSS variables derived from themeConfig.js
const tailwindColors = {
  primary: createHslColorVariable('--nova-primary'),
  'primary-hover': createHslColorVariable('--nova-primary-hover'),
  'primary-focus': createHslColorVariable('--nova-primary-focus'),
  'primary-foreground': createHslColorVariable('--nova-primary-foreground'),
  
  secondary: createHslColorVariable('--nova-secondary'),
  'secondary-hover': createHslColorVariable('--nova-secondary-hover'),
  'secondary-focus': createHslColorVariable('--nova-secondary-focus'),
  'secondary-foreground': createHslColorVariable('--nova-secondary-foreground'),
  
  accent: createHslColorVariable('--nova-accent'),
  'accent-hover': createHslColorVariable('--nova-accent-hover'),
  'accent-focus': createHslColorVariable('--nova-accent-focus'),
  'accent-foreground': createHslColorVariable('--nova-accent-foreground'),
  
  background: createHslColorVariable('--nova-background'),
  foreground: createHslColorVariable('--nova-foreground'),
  
  card: createHslColorVariable('--nova-card'),
  'card-foreground': createHslColorVariable('--nova-card-foreground'),
  
  muted: createHslColorVariable('--nova-muted'),
  'muted-foreground': createHslColorVariable('--nova-muted-foreground'),
  
  border: createHslColorVariable('--nova-border'),
  input: createHslColorVariable('--nova-input'), // For input field borders and specific backgrounds
  'input-focus': createHslColorVariable('--nova-input-focus'),
  ring: createHslColorVariable('--nova-ring'), // For focus rings

  success: createHslColorVariable('--nova-success'),
  'success-foreground': createHslColorVariable('--nova-success-foreground'),
  warning: createHslColorVariable('--nova-warning'),
  'warning-foreground': createHslColorVariable('--nova-warning-foreground'),
  danger: createHslColorVariable('--nova-danger'),
  'danger-foreground': createHslColorVariable('--nova-danger-foreground'),
  info: createHslColorVariable('--nova-info'),
  'info-foreground': createHslColorVariable('--nova-info-foreground'),

  // Neutral scale directly from theme config (these are typically hex or already HSL strings)
  neutral: novaThemeDetails.colors.light.neutral, // Assuming neutral is defined in themeConfig
};

module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/react/dist/**/*.{js,ts,jsx,tsx}'
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
      colors: tailwindColors,
      borderRadius: {
        lg: "var(--radius)", // Use CSS var for border radius
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...FONT_SANS_STRING.split(',').map(f => f.trim())],
        serif: ['var(--font-serif)', ...FONT_SERIF_STRING.split(',').map(f => f.trim())],
        mono: ['var(--font-mono)', ...FONT_MONO_STRING.split(',').map(f => f.trim())],
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        'slide-up': { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'slide-up': 'slide-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'premium': '0px 5px 15px rgba(0, 0, 0, 0.05), 0px 15px 35px rgba(0, 0, 0, 0.1)', // Softer, more diffused shadow
        'premium-hover': '0px 8px 20px rgba(0, 0, 0, 0.07), 0px 18px 40px rgba(0, 0, 0, 0.12)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    heroui({ // Using the heroui plugin with Nova theme details
      themes: {
        light: {
          colors: { // Mapping to HSL vars defined in the CSS
            primary: novaThemeDetails.colors.light.primary.DEFAULT, // Example: '220 90% 55%'
            secondary: novaThemeDetails.colors.light.secondary.DEFAULT,
            accent: novaThemeDetails.colors.light.accent.DEFAULT,
            background: novaThemeDetails.colors.light.background, // This is likely a hex, should be converted to HSL string by the plugin or used as var
            foreground: novaThemeDetails.colors.light.foreground,
            success: novaThemeDetails.colors.light.success.DEFAULT,
            warning: novaThemeDetails.colors.light.warning.DEFAULT,
            danger: novaThemeDetails.colors.light.danger.DEFAULT,
            info: novaThemeDetails.colors.light.info.DEFAULT,
            // ... other HeroUI specific colors if needed
          }
        },
        dark: {
          colors: {
            primary: novaThemeDetails.colors.dark.primary.DEFAULT,
            secondary: novaThemeDetails.colors.dark.secondary.DEFAULT,
            accent: novaThemeDetails.colors.dark.accent.DEFAULT,
            background: novaThemeDetails.colors.dark.background,
            foreground: novaThemeDetails.colors.dark.foreground,
            success: novaThemeDetails.colors.dark.success.DEFAULT,
            warning: novaThemeDetails.colors.dark.warning.DEFAULT,
            danger: novaThemeDetails.colors.dark.danger.DEFAULT,
            info: novaThemeDetails.colors.dark.info.DEFAULT,
          }
        },
      },
      defaultTheme: "light", 
      defaultExtendTheme: "light", // This ensures HeroUI components use these definitions
    }),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')({ strategy: 'class' }), // Recommended strategy
    require("tailwindcss-animate"),
    function({ addBase, theme }) { // Plugin to inject CSS Variables from themeConfig
      const lightVars = {};
      const darkVars = {};

      // Extract HSL values from themeConfig for CSS variables
      // Example: novaThemeDetails.CSSVariables.light['--nova-primary'] = "220 90% 55%";
      if (novaThemeDetails.CSSVariables && novaThemeDetails.CSSVariables.light) {
        for (const key in novaThemeDetails.CSSVariables.light) {
          lightVars[key] = novaThemeDetails.CSSVariables.light[key];
        }
      }
      if (novaThemeDetails.CSSVariables && novaThemeDetails.CSSVariables.dark) {
        for (const key in novaThemeDetails.CSSVariables.dark) {
          darkVars[key] = novaThemeDetails.CSSVariables.dark[key];
        }
      }
      
      addBase({
        ':root': {
          ...lightVars,
          '--radius': novaThemeDetails.radius || '0.5rem', // Add radius from themeConfig
        },
        '.dark': darkVars,
        // Base body styles for better theme integration
        'body': {
          backgroundColor: theme('colors.background'),
          color: theme('colors.foreground'),
          fontFamily: theme('fontFamily.sans').join(', '), // Apply base font
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        }
      });
    }
  ],
};