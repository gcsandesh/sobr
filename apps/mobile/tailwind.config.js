/** @type {import('tailwindcss').Config} */
// Palette/fonts mirror packages/config/src/tokens.ts. Keep them in sync — that
// file remains the canonical source; Tailwind (CJS) can't import the TS ESM build.
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0F1C16',
        surface: '#16271F',
        'surface-raised': '#1E3328',
        overlay: '#243B2F',
        border: '#2C4438',
        'border-strong': '#3A5648',
        text: '#F3EFE6',
        'text-muted': '#AEBDB1',
        'text-faint': '#7C8E80',
        win: '#8FBE7E',
        'win-bg': '#2A3F2C',
        slip: '#D08B66',
        'slip-bg': '#3C2C24',
        frozen: '#88AEC9',
        'frozen-bg': '#26333D',
        accent: '#E6B45C',
        'accent-bg': '#3A2F1C',
      },
      fontFamily: {
        display: ['Fraunces_600SemiBold'],
        'display-bold': ['Fraunces_700Bold'],
        sans: ['Manrope_400Regular'],
        medium: ['Manrope_500Medium'],
        semibold: ['Manrope_600SemiBold'],
        bold: ['Manrope_700Bold'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
      },
    },
  },
  plugins: [],
};
