/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        accent: '#22c55e',
        danger: '#ef4444',
        'bg-themed': 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        card: 'var(--bg-card)',
        themed: 'var(--text-primary)',
        'themed-secondary': 'var(--text-secondary)',
        'border-color': 'var(--border-color)',
      },
    },
  },
  plugins: [],
}
