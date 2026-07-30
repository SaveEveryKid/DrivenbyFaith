/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        clay: {
          50: '#FAF7F2',
          100: '#F2ECE0',
          200: '#E6DBC7',
          300: '#D4C4A3',
          400: '#C2A87D',
          500: '#B08C57',
          600: '#9B7343',
          700: '#7E5E36',
          800: '#654C2D',
          900: '#4E3B24',
        },
        sage: {
          50: '#F4F6F1',
          100: '#E6EBDF',
          200: '#CFD7C1',
          300: '#B1BE9D',
          400: '#93A478',
          500: '#798B5D',
          600: '#5F6E48',
          700: '#4A563A',
          800: '#3C4630',
          900: '#323A29',
        },
        parchment: {
          50: '#FDFBF7',
          100: '#F9F4E8',
          200: '#F5F0E8',
          300: '#EDE3D2',
          400: '#E0D1B8',
          500: '#D2BF9F',
          600: '#C0A87F',
          700: '#A38D6A',
          800: '#877458',
          900: '#6F6049',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
