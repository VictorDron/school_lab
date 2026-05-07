/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'border-blue-500',
    'border-purple-500',
    'border-orange-500',
    'border-green-500',
    'border-emerald-500',
    'border-amber-500',
    'border-pink-500',
    'border-cyan-500',
    'border-neutral-500',
    'border-red-500',
  ],
  theme: {
    extend: {
      colors: {
        // ===== agente lab — DOT · Iris direction =====
        // Primary = Ink ramp. Brand black, primary actions, deep type.
        primary: {
          50:  '#f8f7f5',
          100: '#efede6',
          200: '#dcd9cf',
          300: '#b8b4a8',
          400: '#8b877f',
          500: '#5c5a54',
          600: '#3a3835',
          700: '#2a2825', // Ink-soft
          800: '#1a1916',
          900: '#0E0D0B', // BRAND INK
          950: '#050504',
        },
        // Neutral = Warm Paper / Stone. The 60% of every composition.
        // This auto-applies the warm Paper feel across the whole app.
        neutral: {
          50:  '#F4F2EC', // PAPER (primary surface)
          100: '#E5E2D8', // Paper-deep
          200: '#D4D0C5', // Rule (1px hairline)
          300: '#b8b4a8',
          400: '#8B877F', // Stone
          500: '#5C5A54', // Stone-deep (captions)
          600: '#3f3e39',
          700: '#2A2825', // Ink-soft
          800: '#1a1916',
          900: '#0E0D0B', // Ink
        },
        // Accent = Iris. THE signal. Used max 10% of any composition.
        accent: {
          50:  '#f1eeff',
          100: '#e0daff',
          200: '#c2b8ff',
          300: '#a292ff',
          400: '#8770ff',
          500: '#6B4FFF', // BRAND IRIS
          600: '#5638DD',
          700: '#4528b5',
          800: '#341e89',
          900: '#221363',
          950: '#110a38',
        },
        // Brand-named tokens (for components that want explicit names)
        paper:      '#F4F2EC',
        'paper-deep': '#E5E2D8',
        ink:        '#0E0D0B',
        'ink-soft': '#2A2825',
        rule:       '#D4D0C5',
        stone:      '#8B877F',
        'stone-deep': '#5C5A54',
        iris:       '#6B4FFF',
        'iris-deep':'#5638DD',
        // Status colors — kept editorial (no neon)
        success: {
          50:  '#eef7f1',
          100: '#dcefe2',
          500: '#1B8A4E',
          600: '#15703f',
          700: '#0f5631',
        },
        warning: {
          50:  '#fdf6e8',
          100: '#fbedcf',
          500: '#C99209',
          600: '#a37607',
          700: '#7d5a05',
        },
        error: {
          50:  '#fbeeec',
          100: '#f6ddd9',
          500: '#C0411E',
          600: '#9b3418',
          700: '#762812',
        },
        // Module accent colors
        module: {
          communication: '#6366f1',
          procurement:   '#10b981',
          assets:        '#f97316',
          crm:           '#ec4899',
          ged:           '#3b82f6',
          admin:         '#6b7280',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Inter', 'serif'],
        serif:   ['Fraunces', 'serif'],
        mono:    ['"Geist Mono"', 'JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      letterSpacing: {
        'tightest': '-0.05em',
        'display':  '-0.035em',
        'mono':     '0.18em',
        'caption':  '0.14em',
      },
      borderRadius: {
        'sm':  '0.25rem',
        'md':  '0.375rem',
        'lg':  '0.5rem',
        'xl':  '0.75rem',
      },
      boxShadow: {
        'soft':   '0 1px 2px rgba(14, 13, 11, 0.04), 0 4px 12px rgba(14, 13, 11, 0.04)',
        'medium': '0 4px 16px -4px rgba(14, 13, 11, 0.10), 0 2px 6px rgba(14, 13, 11, 0.04)',
        'large':  '0 12px 32px -8px rgba(14, 13, 11, 0.14), 0 4px 10px rgba(14, 13, 11, 0.06)',
        'xlarge': '0 24px 56px -12px rgba(14, 13, 11, 0.20)',
        'press':  'inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 2px rgba(14,13,11,0.08)',
        'iris-glow':'0 0 0 4px rgba(107, 79, 255, 0.18)',
      },
      backgroundImage: {
        'paper-grain':
          'radial-gradient(circle at 1px 1px, rgba(14,13,11,0.025) 1px, transparent 0)',
        'iris-gradient':
          'linear-gradient(135deg, #6B4FFF 0%, #8770ff 100%)',
        'monolith':
          'linear-gradient(transparent 49.5%, rgba(255,255,255,0.04) 49.5%, rgba(255,255,255,0.04) 50.5%, transparent 50.5%), linear-gradient(90deg, transparent 49.5%, rgba(255,255,255,0.04) 49.5%, rgba(255,255,255,0.04) 50.5%, transparent 50.5%)',
      },
      backgroundSize: {
        'grain': '24px 24px',
        'monolith': '80px 80px',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-right':'slideRight 0.3s ease-out',
        'scale-in':   'scaleIn 0.2s ease-out',
        'spin-slow':  'spin 2s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'iris-pulse': 'irisPulse 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:     { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:    { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown:  { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideRight: { '0%': { opacity: '0', transform: 'translateX(-10px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:    { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        pulseSoft:  { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        irisPulse:  {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(107, 79, 255, 0.4)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(107, 79, 255, 0)' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
