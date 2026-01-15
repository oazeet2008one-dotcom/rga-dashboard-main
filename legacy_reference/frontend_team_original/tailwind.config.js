/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      fontSize: {
        xs: ['1rem', { lineHeight: '1.6' }], // ~16px
        sm: ['1.1rem', { lineHeight: '1.6' }],
        base: ['1.25rem', { lineHeight: '1.7' }], // ~20px body
        lg: ['1.4rem', { lineHeight: '1.7' }],
        xl: ['1.6rem', { lineHeight: '1.4' }],
        '2xl': ['2rem', { lineHeight: '1.35' }], // ~32px main headings
        '3xl': ['2.3rem', { lineHeight: '1.3' }],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}
