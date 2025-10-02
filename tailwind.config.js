/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.{html,js,ts,jsx,tsx}",
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