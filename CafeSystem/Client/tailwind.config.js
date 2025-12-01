/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // This enables manual dark mode toggling
  theme: {
    extend: {
      colors: {
        // Custom colors for Luxury Dark Mode
        luxury: {
          900: '#121212', // Very dark background
          800: '#1E1E1E', // Card background
          gold: '#D4AF37', // Gold accent
        },
        // Custom colors for Modern Light Mode
        modern: {
          50: '#F8FAFC', // Very light background
          100: '#F1F5F9', // Card background
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Clean modern font
      }
    },
  },
  plugins: [],
}
