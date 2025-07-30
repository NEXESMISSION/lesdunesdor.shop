/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'solid-gold': '#AA771C',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 