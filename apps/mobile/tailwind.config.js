/** @type {import('tailwindcss').Config} */
// Palette/fonts mirror packages/config/src/tokens.ts. Keep them in sync — that
// file remains the canonical source; Tailwind (CJS) can't import the TS ESM build.
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  // Class-based dark mode: the app forces a scheme explicitly, so 'media' makes
  // NativeWind throw "Cannot manually set color scheme" on web.
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#FFFFFF',
        surface: '#F5F8F5',
        'surface-raised': '#EBF2EA',
        overlay: '#DFEBDE',
        border: '#E1E8E0',
        'border-strong': '#C7D6C4',
        text: '#16241C',
        'text-muted': '#4A5A4F',
        'text-faint': '#7C8E80',
        win: '#3E8E5B',
        'win-bg': '#E3F2E4',
        slip: '#C0704A',
        'slip-bg': '#F7E9E1',
        frozen: '#4A7FA6',
        'frozen-bg': '#E4EEF5',
        accent: '#3E8E5B',
        'accent-bg': '#E3F2E4',
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
