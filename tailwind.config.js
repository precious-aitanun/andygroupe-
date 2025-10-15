/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{App,components,hooks,utils,pages}/**/*.{js,ts,jsx,tsx}",
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
