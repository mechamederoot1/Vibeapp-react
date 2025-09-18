/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#87CEEB',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        vibe: {
          blue: '#2563eb',          // Azul mais escuro e vibrante
          'blue-dark': '#1d4ed8',   // Azul ainda mais escuro
          'blue-light': '#3b82f6'   // Azul claro mais saturado
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },
      height: {
        screen: ['100vh', '100dvh'],
      },
      minHeight: {
        screen: ['100vh', '100dvh'],
      },
      maxWidth: {
        'screen': '100vw',
        'full': '100%',
      },
      width: {
        'screen': '100vw',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
