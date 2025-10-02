/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontSize: {
        '9xl': '8rem',
        '10xl': '10rem'
      }
    },
  },
  plugins: [],
}