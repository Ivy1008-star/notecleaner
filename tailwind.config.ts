import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
          soft: '#eef2ff',
        },
        ink: '#0f172a',
        slate: '#64748b',
      },
      borderRadius: {
        xl2: '12px',
      },
    },
  },
  plugins: [],
} satisfies Config
