/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ── Trilhas da Infância brand palette ──────────────
        brand: {
          green:       '#A8C5B5',
          'green-dark':'#5A7A6A',
          'green-deep':'#3D5C4E',
          blue:        '#BBD7E8',
          yellow:      '#FAD9A6',
          salmon:      '#F7BFAE',
          lavender:    '#DCC7E7',
          // support
          'green-light': '#E6F1EA',
          'blue-light':  '#EAF2FA',
          'yellow-light':'#FFF5E1',
          'salmon-light':'#FDE9F1',
          'lavender-light':'#F3ECFA',
          // neutrals
          'gray-warm':  '#8F8D8A',
          'gray-mid':   '#BAB9B6',
          'gray-light': '#E6E4E1',
          'cream':      '#FAF8F5',
          'white':      '#FFFFFF',
        },
        text: {
          primary:   '#3A3A3A',
          secondary: '#666666',
          muted:     '#999999',
        }
      },
      fontFamily: {
        sans:    ['Nunito', 'Nunito Sans', 'sans-serif'],
        display: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft':  '0 2px 12px rgba(0,0,0,0.06)',
        'card':  '0 4px 20px rgba(0,0,0,0.08)',
        'float': '0 8px 32px rgba(0,0,0,0.12)',
      },
      backgroundImage: {
        'gradient-trilhas': 'linear-gradient(135deg, #A8C5B5 0%, #BBD7E8 50%, #DCC7E7 100%)',
        'gradient-warm':    'linear-gradient(135deg, #FAD9A6 0%, #F7BFAE 100%)',
        'gradient-soft':    'linear-gradient(180deg, #FAF8F5 0%, #F3ECFA 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'float':      'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
      },
    },
  },
  plugins: [],
}
