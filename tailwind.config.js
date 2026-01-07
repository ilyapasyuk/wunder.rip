/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Основные цвета из вашей палитры
        background: {
          DEFAULT: '#f6f7fb',
          dark: '#1a1b23',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#2d2e3a',
        },
        primary: {
          DEFAULT: '#0073ea',
          hover: '#0060b9',
          light: '#cce5ff',
          dark: '#0056a8',
        },
        text: {
          primary: '#323338',
          secondary: '#676879',
          dark: {
            primary: '#ffffff',
            secondary: '#a0a0b0',
          },
        },
        border: {
          DEFAULT: '#c3c6d4',
          light: '#d0d4e4',
          dark: '#3d3e4a',
        },
        header: {
          DEFAULT: '#323338',
          dark: '#1a1b23',
        },
        success: {
          DEFAULT: '#00854d',
          dark: '#00a85f',
        },
        overlay: {
          DEFAULT: 'rgba(41, 47, 76, 0.7)',
          hover: 'rgba(103, 104, 121, 0.1)',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
