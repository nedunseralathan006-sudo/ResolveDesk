/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: { DEFAULT: '#101C2B', secondary: '#111827' },
        primary: { DEFAULT: '#2563EB', secondary: '#3B6FF5', light: '#EBF2FF', 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
        background: '#F5F7FA',
        status: {
          open: '#F59E0B',
          'open-bg': '#FEF3C7',
          'in-progress': '#2563EB',
          'in-progress-bg': '#DBEAFE',
          resolved: '#10B981',
          'resolved-bg': '#D1FAE5',
          escalated: '#EF4444',
          'escalated-bg': '#FEE2E2',
          closed: '#6B7280',
          'closed-bg': '#F3F4F6',
        },
        priority: {
          critical: '#EF4444',
          'critical-bg': '#FEE2E2',
          high: '#F97316',
          'high-bg': '#FFEDD5',
          medium: '#F59E0B',
          'medium-bg': '#FEF3C7',
          low: '#10B981',
          'low-bg': '#D1FAE5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
