import forms from '@tailwindcss/forms'
import type { Config } from 'tailwindcss'

// Every color is a CSS variable from index.css, so `.dark` flips the palette in one place.
// The legacy `*-dark` keys point at the same variables: existing `dark:` classes stay valid.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        display: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      colors: {
        background: { DEFAULT: v('bg'), dark: v('bg') },
        surface: { DEFAULT: v('surface'), dark: v('surface') },
        muted: { DEFAULT: v('muted'), strong: v('muted-strong') },
        ink: { DEFAULT: v('ink'), soft: v('ink-soft') },
        'on-ink': v('on-ink'),
        accent: { DEFAULT: v('accent') },
        primary: {
          DEFAULT: v('ink'),
          hover: v('ink-soft'),
          light: v('muted'),
          dark: v('ink'),
        },
        text: {
          primary: v('text'),
          secondary: v('text-2'),
          tertiary: v('text-3'),
          dark: { primary: v('text'), secondary: v('text-2') },
        },
        border: { DEFAULT: v('line'), light: v('line'), dark: v('line') },
        header: { DEFAULT: v('bg'), dark: v('bg') },
        success: { DEFAULT: v('success'), dark: v('success') },
        danger: { DEFAULT: v('danger'), dark: v('danger') },
        overlay: {
          DEFAULT: 'rgb(11 14 23 / 0.45)',
          hover: v('muted'),
        },
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'fade-up': 'fade-up 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 200ms ease-out both',
      },
      boxShadow: {
        // Cards: a hairline "lip" at the bottom, like the reference's task rows.
        card: 'inset 0 -1px 0 rgb(0 0 0 / 0.05)',
        tile: '0 1px 2px rgb(16 24 40 / 0.06), 0 2px 8px rgb(16 24 40 / 0.08)',
        soft: '0 1px 2px rgb(16 24 40 / 0.04), 0 8px 24px -12px rgb(16 24 40 / 0.14)',
        lift: '0 24px 48px -16px rgb(16 24 40 / 0.28)',
      },
    },
  },
  plugins: [forms],
} satisfies Config
