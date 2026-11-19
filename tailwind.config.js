/** @type {import('tailwindcss').Config} */

// Semantic color tokens. Each resolves to an RGB triplet declared in
// src/styles/globals.css for the light theme and overridden under
// html[data-theme="dark"], so utilities such as `bg-surface/60` keep working.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        page: token('page'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        'line-strong': token('line-strong'),
        accent: token('accent'),
        'accent-ink': token('accent-ink'),
        live: token('live'),
        warn: token('warn'),
        danger: token('danger'),
        // Legacy aliases kept for the shadcn-style button and body classes.
        background: token('page'),
        foreground: token('ink'),
        'muted-foreground': token('muted'),
        card: token('surface'),
        primary: {
          DEFAULT: token('ink'),
          foreground: token('page'),
        },
        secondary: token('surface-2'),
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Iowan Old Style', 'Georgia', 'serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: {
        shell: '80rem',
      },
    },
  },
  plugins: [],
};
