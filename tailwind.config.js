/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#4F46E5', // A nice purple for primary actions
        secondary: '#6B7280', // Gray for secondary text
        accent: '#FCD34D', // A golden yellow for accents, matching Sheelaa's theme
      },
    },
  },
  plugins: [],
}
