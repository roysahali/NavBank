/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        novbank: {
          950: '#020B18',
          900: '#0A1628',
          800: '#0D2147',
          700: '#163669',
          600: '#1B4DA8',
          500: '#2563EB',
          gold: '#C8972A',
          'gold-light': '#F5B731',
        },
        bank: {
          900: '#0f2b4c',
          800: '#1a3a5f',
          700: '#1e4976',
          600: '#2563a8',
          500: '#3b82c4',
          100: '#dbeafe',
          50:  '#eff6ff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
