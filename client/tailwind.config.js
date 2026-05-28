/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        ocean: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        grape: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        },
        mint: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          900: '#0f172a',
        },
        sage: {
          50: '#f4f7f5',
          100: '#e8efe9',
          200: '#d1dfd5',
          500: '#6b9080',
          600: '#557366',
          700: '#455c52',
        },
        warm: { 900: '#0f172a' },
        cream: { 50: '#faf9f6' },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 8px 32px -8px rgba(249, 115, 22, 0.35)',
        card: '0 4px 24px -6px rgba(15, 23, 42, 0.12)',
        vivid: '0 10px 40px -10px rgba(168, 85, 247, 0.25)',
      },
      backgroundImage: {
        'mesh': 'radial-gradient(at 0% 0%, rgba(249,115,22,0.25) 0, transparent 50%), radial-gradient(at 100% 0%, rgba(168,85,247,0.2) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(6,182,212,0.2) 0, transparent 50%), radial-gradient(at 0% 100%, rgba(244,63,94,0.15) 0, transparent 50%)',
        'sidebar': 'linear-gradient(180deg, #1e1b4b 0%, #312e81 45%, #4c1d95 100%)',
      },
    },
  },
  plugins: [],
};
