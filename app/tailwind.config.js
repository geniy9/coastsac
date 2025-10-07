const animate = require('tailwindcss-animate')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
    './components/ui/**/*.{js,vue,ts}',
  ],
  prefix: '',
  theme: {
    screens: {
      "xs": "420px",
      "sm": "640px",
      "md": "768px",
      "lg": "1024px",
      "xl": "1280px",
      '2xl': '1400px',
      '3xl': '1600px'
    },
    container: {
      center: true,
      padding: '2rem',
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#002b58',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: '#fe0000',
          foreground: '#b5bbc8',
        },
        accent: {
          DEFAULT: '#fe0000',
          foreground: '#b5bbc8',
        },
      },
      transitionDuration: {
        '2000': '2000ms',
        '4000': '4000ms',
        '6000': '6000ms',
        '8000': '8000ms',
        '16000': '16000ms',
        '32000': '32000ms',
      },
      transitionDelay: {
        '100': '100ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '600': '600ms',
        '700': '700ms',
        '800': '800ms',
        '900': '900ms',
        '1000': '1000ms',
        '2000': '2000ms',
        '4000': '4000ms',
        '6000': '6000ms',
        '8000': '8000ms',
        '16000': '32000ms',
      },
      keyframes: {
        'pan-image': {
          '0%': { objectPosition: '0% 50%' },
          '100%': { objectPosition: '100% 50%' },
        },
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "collapsible-down": {
          from: { height: 0 },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        "collapsible-up": {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.2s ease-out",
        "collapsible-up": "collapsible-up 0.2s ease-out",
      },
      fontFamily: {
        black: ['black', 'sans-serif'],
        bold: ['bold', 'sans-serif'],
        regular: ['regular', 'sans-serif'],
        light: ['light', 'sans-serif'],
      }
    },
  },
  plugins: [animate],
}