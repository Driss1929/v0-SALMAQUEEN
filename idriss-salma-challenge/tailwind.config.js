/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#FDE2E4',
          100: '#FBCBD0',
          200: '#F7A5AD',
          300: '#F37F8A',
          400: '#EF5967',
          500: '#EB3344',
          600: '#D72A3A',
          700: '#C32130',
          800: '#AF1826',
          900: '#9B0F1C',
        },
        blue: {
          50: '#BEE3F8',
          100: '#A8D8F5',
          200: '#92CDF2',
          300: '#7CC2EF',
          400: '#66B7EC',
          500: '#50ACE9',
          600: '#3A9BE6',
          700: '#248AE3',
          800: '#0E79E0',
          900: '#0068DD',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [],
}
