/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.{html,js,ts}",
    "./src/**/*.{html,js,ts}"
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