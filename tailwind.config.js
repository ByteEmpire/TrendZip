/** @type {import('tailwindcss').Config} */
export default {
    content: [
      './index.html',
      './src/**/*.{js,ts,jsx,tsx}',
    ],
  
    theme: {
      extend: {
        // ─── TrendZip Color System ───────────────────────────────────────────
        colors: {
          'tz-black':      '#0a0a0a',   // page background
          'tz-dark':       '#111111',   // card backgrounds
          'tz-surface':    '#1a1a1a',   // elevated surfaces
          'tz-surface-2':  '#222222',   // input backgrounds
          'tz-border':     '#2a2a2a',   // borders
          'tz-border-2':   '#383838',   // hover borders
          'tz-muted':      '#666666',   // placeholder text, icons
          'tz-subtle':     '#999999',   // secondary text
          'tz-text':       '#e8e0d6',   // body text (warm white)
          'tz-white':      '#f5f0eb',   // headings, high emphasis
          'tz-gold':       '#c9a96e',   // primary accent
          'tz-gold-light': '#e8c98a',   // hover state
          'tz-gold-dark':  '#a08040',   // active/pressed state
          'tz-gold-muted': 'rgba(201,169,110,0.15)', // subtle gold bg
          'tz-accent':     '#e84040',   // destructive / sale badges
          'tz-success':    '#4caf7d',   // success states
          'tz-info':       '#4c9fcf',   // informational
        },
  
        // ─── Typography ─────────────────────────────────────────────────────
        fontFamily: {
          display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
          body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
          mono:    ['"JetBrains Mono"', 'Consolas', 'monospace'],
        },
  
        fontSize: {
          'display-2xl': ['5.5rem',  { lineHeight: '1.02', letterSpacing: '-0.025em' }],
          'display-xl':  ['4.5rem',  { lineHeight: '1.04', letterSpacing: '-0.02em'  }],
          'display-lg':  ['3.5rem',  { lineHeight: '1.08', letterSpacing: '-0.015em' }],
          'display-md':  ['2.5rem',  { lineHeight: '1.12', letterSpacing: '-0.01em'  }],
          'display-sm':  ['1.875rem',{ lineHeight: '1.18', letterSpacing: '-0.005em' }],
        },
  
        // ─── Spacing Extras ──────────────────────────────────────────────────
        spacing: {
          '4.5': '1.125rem',
          '13':  '3.25rem',
          '15':  '3.75rem',
          '18':  '4.5rem',
          '22':  '5.5rem',
          '26':  '6.5rem',
          '30':  '7.5rem',
          '88':  '22rem',
          '100': '25rem',
          '112': '28rem',
          '128': '32rem',
          '144': '36rem',
        },
  
        // ─── Custom Shadows ─────────────────────────────────────────────────
        boxShadow: {
          'gold':        '0 0 30px rgba(201,169,110,0.2)',
          'gold-sm':     '0 0 12px rgba(201,169,110,0.15)',
          'gold-inset':  'inset 0 0 20px rgba(201,169,110,0.1)',
          'card':        '0 4px 24px rgba(0,0,0,0.4)',
          'card-hover':  '0 16px 48px rgba(0,0,0,0.6)',
          'modal':       '0 24px 80px rgba(0,0,0,0.85)',
          'header':      '0 1px 0 rgba(255,255,255,0.04)',
          'input-focus': '0 0 0 3px rgba(201,169,110,0.12)',
        },
  
        // ─── Transitions ────────────────────────────────────────────────────
        transitionDuration: {
          '250': '250ms',
          '350': '350ms',
          '400': '400ms',
        },
  
        transitionTimingFunction: {
          'spring':    'cubic-bezier(0.34, 1.56, 0.64, 1)',
          'smooth':    'cubic-bezier(0.4, 0, 0.2, 1)',
          'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        },
  
        // ─── Animations ─────────────────────────────────────────────────────
        animation: {
          'fade-in':        'fadeIn 0.5s ease forwards',
          'fade-in-fast':   'fadeIn 0.25s ease forwards',
          'slide-up':       'slideUp 0.5s ease forwards',
          'slide-up-fast':  'slideUp 0.3s ease forwards',
          'slide-down':     'slideDown 0.4s ease forwards',
          'slide-in-right': 'slideInRight 0.4s ease forwards',
          'scale-in':       'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
          'shimmer':        'shimmer 2.2s infinite linear',
          'spin-slow':      'spin 3s linear infinite',
          'pulse-gold':     'pulseGold 2s ease-in-out infinite',
        },
  
        keyframes: {
          fadeIn: {
            from: { opacity: '0' },
            to:   { opacity: '1' },
          },
          slideUp: {
            from: { opacity: '0', transform: 'translateY(20px)' },
            to:   { opacity: '1', transform: 'translateY(0)' },
          },
          slideDown: {
            from: { opacity: '0', transform: 'translateY(-12px)' },
            to:   { opacity: '1', transform: 'translateY(0)' },
          },
          slideInRight: {
            from: { opacity: '0', transform: 'translateX(20px)' },
            to:   { opacity: '1', transform: 'translateX(0)' },
          },
          scaleIn: {
            from: { opacity: '0', transform: 'scale(0.94)' },
            to:   { opacity: '1', transform: 'scale(1)' },
          },
          shimmer: {
            '0%':   { backgroundPosition: '-200% 0' },
            '100%': { backgroundPosition: '200% 0' },
          },
          pulseGold: {
            '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,169,110,0.35)' },
            '50%':      { boxShadow: '0 0 0 8px rgba(201,169,110,0)' },
          },
        },
  
        // ─── Background Images ───────────────────────────────────────────────
        backgroundImage: {
          'gold-gradient':    'linear-gradient(135deg, #c9a96e 0%, #e8c98a 50%, #c9a96e 100%)',
          'gold-radial':      'radial-gradient(ellipse at center, rgba(201,169,110,0.15) 0%, transparent 70%)',
          'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
          'hero-gradient':    'linear-gradient(160deg, #0a0a0a 0%, #0f0d0b 40%, #0a0908 100%)',
          'card-gradient':    'linear-gradient(180deg, transparent 50%, rgba(10,10,10,0.95) 100%)',
        },
  
        // ─── Breakpoints ────────────────────────────────────────────────────
        screens: {
          'xs': '375px',
          '3xl': '1920px',
        },
  
        // ─── Z-index scale ──────────────────────────────────────────────────
        zIndex: {
          'header':   '100',
          'drawer':   '200',
          'modal':    '300',
          'toast':    '400',
          'tooltip':  '500',
        },
      },
    },
  
    plugins: [],
  }