import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: '#E8D5B5',
        input: '#E8D5B5',
        ring: '#D96C39',
        background: '#F7F1E8',
        foreground: '#3F2E23',
        primary: {
          DEFAULT: '#D96C39',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#6B4F3E',
          foreground: '#F7F1E8',
        },
        destructive: {
          DEFAULT: 'hsl(0, 84.2%, 60.2%)',
          foreground: 'hsl(210, 40%, 98%)',
        },
        muted: {
          DEFAULT: '#E8D5B5',
          foreground: '#6B4F3E',
        },
        accent: {
          DEFAULT: '#F4C27A',
          foreground: '#3F2E23',
        },
        popover: {
          DEFAULT: '#F7F1E8',
          foreground: '#3F2E23',
        },
        card: {
          DEFAULT: '#F7F1E8',
          foreground: '#3F2E23',
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
