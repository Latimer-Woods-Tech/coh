/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Harlem Renaissance Palette — CypherOfHealing 2026
        heritage: {
          DEFAULT: '#2C1810',
          light:   '#3D2B1F',
          dark:    '#1A0E09',
        },
        sepia: {
          DEFAULT: '#704214',
          light:   '#8B5E3C',
          dark:    '#5A3410',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light:   '#DFC278',
          dark:    '#A8893E',
          pale:    '#F0E4B8',
        },
        ivory: {
          DEFAULT: '#F5ECD7',
          warm:    '#EDE0C4',
        },
        parchment: {
          DEFAULT: '#E8DCBE',
          dark:    '#D4C89A',
        },
        tobacco: '#8B5E3C',
        ember:   '#A0522D',
        teal: {
          DEFAULT: '#1A3A3A',
          light:   '#2A5050',
        },
        // Legacy aliases so existing components don't break
        primary: {
          50:  '#FAF6EE',
          100: '#F0E4B8',
          200: '#DFC278',
          300: '#C9A84C',
          400: '#B08940',
          500: '#C9A84C',
          600: '#A8893E',
          700: '#8B6F30',
          800: '#704214',
          900: '#2C1810',
        },
        dark: {
          50:  '#F5ECD7',
          100: '#E8DCBE',
          200: '#D4C89A',
          300: '#8B5E3C',
          400: '#704214',
          500: '#5A3410',
          600: '#4A2C0E',
          700: '#3D2B1F',
          800: '#2C1810',
          900: '#1A0E09',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif:   ['"Libre Baskerville"', 'Georgia', 'Times New Roman', 'serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'Menlo', 'monospace'],
      },
      animation: {
        'fade-in':  'fadeIn 0.4s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
      backgroundImage: {
        'warm-gradient': 'linear-gradient(135deg, #2C1810 0%, #3D2B1F 100%)',
        'ivory-gradient': 'linear-gradient(180deg, #F5ECD7 0%, #E8DCBE 100%)',
        'gold-gradient':  'linear-gradient(135deg, #C9A84C 0%, #A8893E 100%)',
      },
    },
  },
  plugins: [],
};
