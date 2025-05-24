// Modular theme configuration for HeroUI and future themes

export const heroUITheme = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--nova-primary))', // Rich Blue
          foreground: 'hsl(var(--nova-primary-foreground))', // White
        },
        secondary: {
          DEFAULT: 'hsl(var(--nova-secondary))', // Deep Teal
          foreground: 'hsl(var(--nova-secondary-foreground))', // Off-white
        },
        background: 'hsl(var(--nova-background))', // Light Gray (Light Mode) / Very Dark Blue (Dark Mode)
        foreground: 'hsl(var(--nova-foreground))', // Dark Gray (Light Mode) / Light Gray (Dark Mode)
        accent: {
          DEFAULT: 'hsl(var(--nova-accent))', // Gold
          foreground: 'hsl(var(--nova-accent-foreground))', // Dark Brown
        },
        muted: {
          DEFAULT: 'hsl(var(--nova-muted))', // Medium Gray
          foreground: 'hsl(var(--nova-muted-foreground))', // Darker Gray / Lighter Gray
        },
        card: {
          DEFAULT: 'hsl(var(--nova-card))', // White (Light Mode) / Dark Slate (Dark Mode)
          foreground: 'hsl(var(--nova-card-foreground))', // Dark Gray (Light Mode) / Light Gray (Dark Mode)
        },
        border: 'hsl(var(--nova-border))', // Light Gray / Dark Gray
        input: 'hsl(var(--nova-input))', // Lighter Gray / Darker Slate
        ring: 'hsl(var(--nova-ring))', // Accent Gold
        
        // Specific UI elements for a premium feel
        'premium-text-gradient': 'linear-gradient(to right, hsl(var(--nova-primary)), hsl(var(--nova-accent)))',
        'premium-button-primary-bg': 'hsl(var(--nova-primary))',
        'premium-button-primary-hover-bg': 'hsl(var(--nova-primary-hover))', // Slightly darker blue
        'premium-button-secondary-bg': 'hsl(var(--nova-secondary))',
        'premium-button-secondary-hover-bg': 'hsl(var(--nova-secondary-hover))', // Slightly darker teal
        'premium-card-bg': 'hsl(var(--nova-card))',
        'premium-card-border': 'hsl(var(--nova-border))',
        'premium-input-bg': 'hsl(var(--nova-input))',
        'premium-input-focus-border': 'hsl(var(--nova-accent))',
        'premium-input-focus-ring': 'hsl(var(--nova-accent))',

        // Semantic colors
        success: {
          DEFAULT: 'hsl(var(--nova-success))', // Green
          foreground: 'hsl(var(--nova-success-foreground))', // White
        },
        warning: {
          DEFAULT: 'hsl(var(--nova-warning))', // Amber
          foreground: 'hsl(var(--nova-warning-foreground))', // Dark Brown
        },
        danger: {
          DEFAULT: 'hsl(var(--nova-danger))', // Red
          foreground: 'hsl(var(--nova-danger-foreground))', // White
        },
        info: {
          DEFAULT: 'hsl(var(--nova-info))', // Sky Blue
          foreground: 'hsl(var(--nova-info-foreground))', // White
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
        serif: ['var(--font-serif)', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        mono: ['var(--font-mono)', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
};

export const defaultTheme = { // This will be used by Tailwind config
  '--nova-primary': '210 90% 50%', // Rich Blue (HSL)
  '--nova-primary-hover': '210 90% 45%', // Slightly Darker Blue
  '--nova-primary-foreground': '0 0% 100%', // White
  '--nova-secondary': '180 70% 40%', // Deep Teal
  '--nova-secondary-hover': '180 70% 35%', // Slightly Darker Teal
  '--nova-secondary-foreground': '210 20% 95%', // Off-white
  '--nova-accent': '45 100% 50%', // Gold
  '--nova-accent-foreground': '30 50% 20%', // Dark Brown

  '--nova-background': '220 15% 95%', // Light Mode: Light Gray
  '--nova-foreground': '220 10% 25%', // Light Mode: Dark Gray
  '--nova-card': '0 0% 100%', // Light Mode: White
  '--nova-card-foreground': '220 10% 25%', // Light Mode: Dark Gray
  '--nova-muted': '220 10% 65%', // Light Mode: Medium Gray
  '--nova-muted-foreground': '220 10% 35%', // Light Mode: Darker Gray
  '--nova-border': '220 10% 88%', // Light Mode: Light Gray
  '--nova-input': '220 10% 92%', // Light Mode: Lighter Gray
  '--nova-ring': '45 100% 50%', // Gold

  '--nova-success': '140 70% 45%', // Green
  '--nova-success-foreground': '0 0% 100%',
  '--nova-warning': '35 90% 55%', // Amber
  '--nova-warning-foreground': '30 50% 20%',
  '--nova-danger': '0 80% 55%', // Red
  '--nova-danger-foreground': '0 0% 100%',
  '--nova-info': '190 80% 60%', // Sky Blue
  '--nova-info-foreground': '0 0% 100%',

  '--radius': '0.75rem', // Example border radius

  // Dark theme variables
  '--dark-nova-primary': '210 90% 60%', // Lighter Rich Blue for Dark Mode
  '--dark-nova-primary-hover': '210 90% 55%',
  '--dark-nova-primary-foreground': '0 0% 100%',
  '--dark-nova-secondary': '180 70% 50%', // Lighter Deep Teal
  '--dark-nova-secondary-hover': '180 70% 45%',
  '--dark-nova-secondary-foreground': '210 20% 95%',
  '--dark-nova-accent': '45 100% 60%', // Lighter Gold
  '--dark-nova-accent-foreground': '30 50% 20%',

  '--dark-nova-background': '220 25% 10%', // Dark Mode: Very Dark Blue/Gray
  '--dark-nova-foreground': '220 15% 85%', // Dark Mode: Light Gray
  '--dark-nova-card': '220 20% 15%', // Dark Mode: Dark Slate
  '--dark-nova-card-foreground': '220 15% 85%', // Dark Mode: Light Gray
  '--dark-nova-muted': '220 15% 40%', // Dark Mode: Dark Gray
  '--dark-nova-muted-foreground': '220 15% 70%', // Dark Mode: Lighter Gray
  '--dark-nova-border': '220 15% 25%', // Dark Mode: Dark Gray
  '--dark-nova-input': '220 15% 20%', // Dark Mode: Darker Slate
  '--dark-nova-ring': '45 100% 60%',

  '--dark-nova-success': '140 60% 55%',
  '--dark-nova-success-foreground': '0 0% 100%',
  '--dark-nova-warning': '35 80% 65%',
  '--dark-nova-warning-foreground': '30 50% 15%',
  '--dark-nova-danger': '0 70% 65%',
  '--dark-nova-danger-foreground': '0 0% 100%',
  '--dark-nova-info': '190 70% 70%',
  '--dark-nova-info-foreground': '0 0% 100%',
};

// Font setup (example, replace with your actual font setup)
export const fonts = {
  sans: 'Inter, sans-serif', // Example, ensure Inter is loaded
  serif: 'Lora, serif',     // Example, ensure Lora is loaded
  mono: 'Fira Code, monospace' // Example, ensure Fira Code is loaded
};

export const themeConfig = {
  heroUITheme,
  defaultTheme, // This is what tailwind.config.js will import and spread
  fonts,
};

export default themeConfig; 