const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './public/*.html',
    './app/helpers/**/*.rb',
    './app/javascript/**/*.js',
    './app/views/**/*.{erb,haml,html,slim}'
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', ...defaultTheme.fontFamily.serif],
        display: ['"Cinzel Decorative"', 'serif'],
        body: ['"Crimson Text"', 'serif'],
      },
      colors: {
        parchment: '#f4efe4',
        sepia: '#d4c4a8',
        burgundy: {
          DEFAULT: '#722f37',
          dark: '#4a1f24',
          light: '#8b3d47',
        },
        gold: {
          DEFAULT: '#c9a227',
          dark: '#8b6914',
          light: '#e8c547',
        },
        ink: '#2c1810',
        aged: '#5c4033',
      },
    },
  },
  plugins: []
}
