/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.html"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")], // Adds DaisyUI & Typography
  daisyui: {
    themes: ["dim"], 
  },
}

