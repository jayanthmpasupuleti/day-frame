/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme]'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        card: 'var(--bg-card)',
        inset: 'var(--bg-inset)',
        primary: 'var(--accent-primary)',
        primaryText: 'var(--accent-primary-text)',
        secondary: 'var(--accent-secondary)',
      },
      borderColor: {
        card: 'var(--border-card)',
      },
    },
  },
  plugins: [],
};
