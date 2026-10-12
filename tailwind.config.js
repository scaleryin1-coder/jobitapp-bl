/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#4B6EF5',
          hover: '#3D5FE0',
          light: '#EAF0FF',
        },
        ice: {
          50: '#F5FBFF',
          100: '#E9F8FD',
          200: '#D9F2FA',
        },
        sky: {
          500: '#0EA5E0',
          400: '#38BDF8',
        },
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.04)',
        'nav': '0 -4px 20px rgba(0, 0, 0, 0.05)',
        'card': '0 8px 24px -4px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
