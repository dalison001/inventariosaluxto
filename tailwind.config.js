/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta base — azul quase preto
        background: {
          DEFAULT: '#0a0f1e',
          secondary: '#0d1426',
        },
        surface: {
          DEFAULT: '#111827',  // gray-900
          hover: '#1a2332',
          active: '#1e2d45',
        },
        border: {
          DEFAULT: '#1e3a5f',
          subtle: '#162035',
          strong: '#2563eb',
        },
        primary: {
          DEFAULT: '#2563eb',  // blue-600
          hover: '#1d4ed8',    // blue-700
          light: '#3b82f6',    // blue-500
          dark: '#1e40af',     // blue-800
          subtle: 'rgba(37, 99, 235, 0.1)',
        },
        accent: {
          DEFAULT: '#38bdf8',  // sky-400
          hover: '#0ea5e9',
        },
        text: {
          DEFAULT: '#f1f5f9',  // slate-100
          muted: '#94a3b8',    // slate-400
          subtle: '#64748b',   // slate-500
          inverse: '#0a0f1e',
        },
        status: {
          pendente: '#f59e0b',         // amber-500
          pendenteBg: 'rgba(245, 158, 11, 0.1)',
          validado: '#10b981',         // emerald-500
          validadoBg: 'rgba(16, 185, 129, 0.1)',
          danger: '#ef4444',           // red-500
          dangerBg: 'rgba(239, 68, 68, 0.1)',
          info: '#38bdf8',             // sky-400
          infoBg: 'rgba(56, 189, 248, 0.1)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(37, 99, 235, 0.3)',
        'glow-blue-lg': '0 0 40px rgba(37, 99, 235, 0.2)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.6)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.5)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanner-line': 'scannerLine 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scannerLine: {
          '0%, 100%': { top: '10%' },
          '50%': { top: '80%' },
        }
      },
      screens: {
        'xs': '375px',
      }
    },
  },
  plugins: [],
}
