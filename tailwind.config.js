/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.{html,js}",
    "./views/**/*.{ejs,html}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette
        'primary-light': 'hsl(var(--p-light) / <alpha-value>)',
        'primary-dark': 'hsl(var(--p-dark) / <alpha-value>)',
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideUp': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient': 'gradient 8s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: 'hsl(var(--bc))',
            a: {
              color: 'hsl(var(--p))',
              '&:hover': {
                color: 'hsl(var(--pf))',
              },
            },
            h1: {
              color: 'hsl(var(--bc))',
            },
            h2: {
              color: 'hsl(var(--bc))',
            },
            h3: {
              color: 'hsl(var(--bc))',
            },
            h4: {
              color: 'hsl(var(--bc))',
            },
            blockquote: {
              color: 'hsl(var(--bc))',
              borderLeftColor: 'hsl(var(--p))',
            },
            'ul > li::before': {
              backgroundColor: 'hsl(var(--bc) / 0.5)',
            },
            'ol > li::before': {
              color: 'hsl(var(--bc) / 0.8)',
            },
            hr: {
              borderColor: 'hsl(var(--bc) / 0.2)',
            },
            strong: {
              color: 'hsl(var(--bc))',
            },
            pre: {
              backgroundColor: 'hsl(var(--n))',
              color: 'hsl(var(--nc))',
            },
            code: {
              color: 'hsl(var(--bc))',
              backgroundColor: 'hsl(var(--bc) / 0.1)',
              borderRadius: theme('borderRadius.md'),
              padding: `${theme('spacing.1')} ${theme('spacing.2')}`,
            },
          },
        },
      }),
      lineClamp: {
        1: '1',
        2: '2',
        3: '3',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#4f46e5",
          "primary-content": "#ffffff",
          "secondary": "#8b5cf6",
          "accent": "#f43f5e",
          "neutral": "#1f2937",
          "base-100": "#f3f4f6",
          "base-200": "#e5e7eb",
          "base-300": "#d1d5db",
          "base-content": "#1f2937",
          "--p-light": "246 96% 77%",
          "--p-dark": "246 96% 33%",
          "--rounded-box": "1rem",
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "1.9rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        },
        dark: {
          "primary": "#6366f1",
          "primary-content": "#ffffff",
          "secondary": "#a78bfa",
          "accent": "#fb7185",
          "neutral": "#1f2937",
          "base-100": "#1e1e2a",
          "base-200": "#191925",
          "base-300": "#15151e",
          "base-content": "#e5e7eb",
          "--p-light": "246 96% 77%",
          "--p-dark": "246 96% 33%",
          "--rounded-box": "1rem",
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "1.9rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        },
      },
    ],
  },
} 