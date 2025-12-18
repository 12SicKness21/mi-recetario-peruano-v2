/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chef: {
          base: '#FDFBF7',
          dark: '#1C1917',
          primary: '#D97706',
          accent: '#78350F',
          muted: '#A8A29E',
          surface: '#FFFFFF',
        }
      },
      backgroundImage: {
        'kitchen-pattern': "url('https://i.postimg.cc/J7fzg4ts/bg-cocina.jpg')",
      },
    },
  },
  plugins: [],
}