/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        soft: 'rgb(var(--soft) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-ink': 'rgb(var(--brand-ink) / <alpha-value>)',
        warm: 'rgb(var(--warm) / <alpha-value>)',
      },
      fontFamily: { sans: ['Nunito', 'system-ui', 'sans-serif'] },
      keyframes: {
        pop: { '0%': { transform: 'scale(.6)', opacity: '0' }, '60%': { transform: 'scale(1.08)', opacity: '1' }, '100%': { transform: 'scale(1)' } },
        rise: { '0%': { transform: 'translateY(24px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        fade: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        confetti: { '0%': { transform: 'translateY(0) rotate(0)', opacity: '1' }, '100%': { transform: 'translateY(-120px) rotate(200deg)', opacity: '0' } },
      },
      animation: {
        pop: 'pop .45s ease-out both',
        rise: 'rise .3s ease-out both',
        fade: 'fade .2s ease-out both',
        confetti: 'confetti 1.1s ease-out both',
      },
    },
  },
  plugins: [],
}
