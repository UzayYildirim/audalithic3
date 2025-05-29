import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a1a',
        secondary: '#2a2a2a',
        accent: '#6366f1',
      },
      fontFamily: {
        sans: ['var(--font-montserrat)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config 