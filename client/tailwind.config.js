/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
        },
        accent: {
          400: '#e8c4a0',
          500: '#d4a574',
          600: '#b8956a',
        },
        ocean: {
          400: '#67e8f9',
          500: '#22d3ee',
          600: '#0891b2',
        },
        grape: {
          400: '#a5b4fc',
          500: '#818cf8',
          600: '#6366f1',
        },
        mint: {
          400: '#6ee7b7',
          500: '#34d399',
          600: '#059669',
        },
        rose: {
          400: '#fda4af',
          500: '#fb7185',
          600: '#e11d48',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          800: '#1e293b',
          900: '#0f172a',
        },
        sage: {
          50: '#f4f7f6',
          100: '#e8eeec',
          200: '#d1ddd9',
          500: '#5f8a7e',
          600: '#4a6f65',
          700: '#3d5c54',
        },
        warm: { 900: '#1c1917' },
        cream: { 50: '#faf9f7' },
        stone: {
          850: '#292524',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        glow: '0 8px 32px -8px rgba(13, 148, 136, 0.28)',
        card: '0 4px 24px -6px rgba(15, 23, 42, 0.08)',
        vivid: '0 10px 40px -10px rgba(13, 148, 136, 0.18)',
        soft: '0 2px 16px -4px rgba(28, 25, 23, 0.06)',
      },
      backgroundImage: {
        mesh: 'radial-gradient(at 0% 0%, rgba(13,148,136,0.12) 0, transparent 50%), radial-gradient(at 100% 0%, rgba(129,140,248,0.1) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(212,165,116,0.12) 0, transparent 50%)',
        sidebar: 'linear-gradient(175deg, #134e4a 0%, #115e59 40%, #1e293b 100%)',
        'page-gradient': 'linear-gradient(160deg, #faf9f7 0%, #f0fdfa 45%, #f8fafc 100%)',
      },
    },
  },
  plugins: [],
};
