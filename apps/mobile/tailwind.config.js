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
        bg: '#F0F5F3',
        surface: '#FAFDFC',
        'surface-raised': '#E3EDE9',
        overlay: '#FAFDFC',
        border: '#D5E3DE',
        'border-strong': '#A9C3BB',
        text: '#16211F',
        'text-muted': '#4A5D59',
        'text-faint': '#6F8480',
        win: '#457029',
        'win-bg': '#D9EFBE',
        slip: '#B5544B',
        'slip-bg': '#FBE7E3',
        frozen: '#3E6FA8',
        'frozen-bg': '#E1ECF7',
        accent: '#1F6F6B',
        'accent-bright': '#2E9D95',
        'accent-bg': '#E2F2EF',
      },
      fontFamily: {
        display: ['Fraunces_900Black'],
        'display-bold': ['Fraunces_900Black'],
        sans: ['Figtree_400Regular'],
        medium: ['Figtree_500Medium'],
        semibold: ['Figtree_600SemiBold'],
        bold: ['Figtree_700Bold'],
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
