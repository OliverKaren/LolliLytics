/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // LoL-inspired dark theme palette
        background: {
          DEFAULT: '#0a0e1a',
          secondary: '#0f1525',
          card: '#141c2e',
          elevated: '#1a2340',
        },
        primary: {
          DEFAULT: '#c89b3c', // LoL gold
          light: '#f0c060',
          dark: '#8a6a1a',
        },
        accent: {
          blue: '#0bc4e3',    // Runic blue
          purple: '#9b59ff',
          red: '#ff4655',     // Danger / tilt
          green: '#00d87f',   // Success
          orange: '#ff8c00',  // Warning
        },
        border: {
          DEFAULT: '#1e2d4a',
          light: '#2a3d5e',
        },
        text: {
          primary: '#e8e0d0',
          secondary: '#8a9bc0',
          muted: '#4a5a7a',
        },
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],          // Epic headers
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-card': 'linear-gradient(135deg, #141c2e 0%, #0f1525 100%)',
        'gradient-gold': 'linear-gradient(90deg, #8a6a1a, #c89b3c, #f0c060)',
      },
      boxShadow: {
        card: '0 4px 20px rgba(0, 0, 0, 0.5)',
        glow: '0 0 20px rgba(200, 155, 60, 0.3)',
        'glow-blue': '0 0 20px rgba(11, 196, 227, 0.3)',
        'glow-red': '0 0 20px rgba(255, 70, 85, 0.3)',
      },
      animation: {
        'pulse-gold': 'pulseGold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        slideIn: {
          from: { transform: 'translateX(-10px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
