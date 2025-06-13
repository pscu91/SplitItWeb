/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'elice-digital-coding': ['Elice Digital Coding', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
