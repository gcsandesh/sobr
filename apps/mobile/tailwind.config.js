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
        bg: '#F4F9F7',
        surface: '#FFFFFF',
        'surface-raised': '#E8F2EE',
        overlay: '#FFFFFF',
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
        flame: '#F97316',
        'flame-deep': '#C2410C',
        'flame-bg': '#FFEDD5',
      },
      fontFamily: {
        // Bricolage Grotesque: a warm grotesk for headings and big numbers
        // (replaced Fraunces, the serif that every AI-built app now uses)
        display: ['BricolageGrotesque_800ExtraBold'],
        'display-bold': ['BricolageGrotesque_800ExtraBold'],
        sans: ['Figtree_400Regular'],
        medium: ['Figtree_500Medium'],
        semibold: ['Figtree_600SemiBold'],
        bold: ['Figtree_700Bold'],
      },
      // a touch less round than before (cards were 32px): still soft, with
      // less dead space in the corners. Mirrors radii in @sobr/config.
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
