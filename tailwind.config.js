/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
          'light': '#3B82F6',
          'DEFAULT': '#2563EB',
          'dark': '#1D4ED8',
        },
      },
    },
  },
  plugins: [],
}
