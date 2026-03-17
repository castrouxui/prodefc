/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        accent: {
          light: '#4CAF50',
          dark:  '#C8F000',
        },
        surface: {
          light: '#f2f2f7',
          dark:  '#1c1c1e',
        },
        card: {
          light: '#ffffff',
          dark:  '#2c2c2e',
        },
      },
    },
  },
  plugins: [],
}
