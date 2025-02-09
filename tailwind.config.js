/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'dark-bg': '#121212',
        'card-bg': '#1e1e1e',
        'support-bg': '#252525',
        'primary': {
          light: '#2B4C7E', // azul mais escuro
          dark: '#1A365D',
        },
        'secondary': {
          light: '#943E3E', // vermelho mais escuro
          dark: '#7C2D2D',
        },
      },
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 