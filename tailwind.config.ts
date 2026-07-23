import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          soft: '#eff6ff',
        },
        ink: '#0f172a',
        slate: '#475569',
      },
      borderRadius: {
        xl2: '14px',
      },
    },
  },
  plugins: [],
} satisfies Config
