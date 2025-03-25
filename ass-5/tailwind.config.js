/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs"], // Update to look for all .ejs files in the views folder
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")], // Adds DaisyUI & Typography
  daisyui: {
    themes: ["dim"], 
  },
}

