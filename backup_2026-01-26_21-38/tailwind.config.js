/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          cyan: '#00C2E0',
          cyanGlow: 'rgba(0, 194, 224, 0.4)',
        },
        text: {
          dark: '#4A5568',
        },
        bg: {
          top: '#F0F9FF',
          bottom: '#D8EEFE',
        },
        card: {
          bg: 'rgba(255, 255, 255, 0.7)',
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        'glass': '8px',
      },
      boxShadow: {
        'cyan-glow': '0 10px 15px -3px rgba(0, 194, 224, 0.4)',
        'cyan-glow-hover': '0 12px 20px -3px rgba(0, 194, 224, 0.5)',
      }
    },
  },
  plugins: [],
}
