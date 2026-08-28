/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dfp: {
          green: {
            50: '#f0fdf6',
            100: '#dcfce8',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          blue: {
            50: '#f0f6fb',
            100: '#dbe8f5',
            200: '#bcd4ec',
            300: '#8eb5de',
            400: '#5c92cc',
            500: '#3b75b5',
            600: '#2c5d99',
            700: '#244b7c',
            800: '#1e3c63',
            900: '#1a3353',
          },
          stone: {
            50: '#fafaf9',
            100: '#f5f4f1',
            200: '#e8e5df',
            300: '#d6d1c9',
            400: '#b8b0a5',
            500: '#9c9386',
            600: '#7d756a',
            700: '#5f5951',
            800: '#4a4540',
            900: '#3d3935',
            950: '#22201d',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Lexend', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}