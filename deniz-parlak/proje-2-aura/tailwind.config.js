// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#070B18',
        primary: '#8B5CF6',
        secondary: '#EC4899',
        surface: 'rgba(255, 255, 255, 0.05)',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #8B5CF655 0deg, #EC489955 180deg, #8B5CF655 360deg)',
      }
    },
  },
  plugins: [],
}