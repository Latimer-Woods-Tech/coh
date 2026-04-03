/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f9f5f0',
          100: '#f3ebe1',
          200: '#e7d7c3',
          300: '#dbc3a5',
          400: '#cfaf87',
          500: '#c39b69',
          600: '#b08850',
          700: '#9d7547',
          800: '#8a623e',
          900: '#774f35',
        },
        dark: {
          50: '#f7f7f7',
          100: '#efefef',
          200: '#dfdfdf',
          300: '#cfcfcf',
          400: '#bfbfbf',
          500: '#afafaf',
          600: '#9f9f9f',
          700: '#7f7f7f',
          800: '#5f5f5f',
          900: '#3f3f3f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
