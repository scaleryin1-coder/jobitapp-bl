/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        sky: {
          500: '#0EA5E0',
          400: '#38BDF8',
        },
        banner: {
          start: '#2B8FD8',
          end: '#6FD0EE',
        }
      },
      boxShadow: {
        'glow': '0 10px 25px -5px rgba(14, 165, 224, 0.4)',
        'card': '0 8px 24px -4px rgba(0, 0, 0, 0.06)',
        'floating': '0 12px 30px rgba(0, 0, 0, 0.35)',
      }
    },
  },
  plugins: [],
}
