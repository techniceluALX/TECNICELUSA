/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        raised: 'rgb(var(--color-surface-raised) / <alpha-value>)',
        line: 'rgb(var(--color-border) / <alpha-value>)',
        ink: 'rgb(var(--color-text-primary) / <alpha-value>)',
        muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        subtle: 'rgb(var(--color-text-subtle) / <alpha-value>)',
        'on-brand': 'rgb(var(--color-text-on-brand) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--color-brand-primary) / <alpha-value>)',
          strong: 'rgb(var(--color-brand-strong) / <alpha-value>)',
        },
        accent: 'rgb(var(--color-brand-secondary) / <alpha-value>)',
        focus: 'rgb(var(--color-focus) / <alpha-value>)',
        highlight: 'rgb(var(--color-display-highlight) / <alpha-value>)',
        glass: {
          DEFAULT: 'rgb(var(--color-glass) / <alpha-value>)',
          hover: 'rgb(var(--color-glass-hover) / <alpha-value>)',
          line: 'rgb(var(--color-glass-border) / <alpha-value>)',
          overlay: 'rgb(var(--color-glass-overlay) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          strong: 'rgb(var(--color-success-strong) / <alpha-value>)',
          contrast: 'rgb(var(--color-success-contrast) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          strong: 'rgb(var(--color-warning-strong) / <alpha-value>)',
          contrast: 'rgb(var(--color-warning-contrast) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          strong: 'rgb(var(--color-danger-strong) / <alpha-value>)',
          contrast: 'rgb(var(--color-danger-contrast) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
          strong: 'rgb(var(--color-info-strong) / <alpha-value>)',
          contrast: 'rgb(var(--color-info-contrast) / <alpha-value>)',
        },
        whatsapp: {
          DEFAULT: 'rgb(var(--color-whatsapp) / <alpha-value>)',
          surface: 'rgb(var(--color-whatsapp-surface) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Oxanium', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
