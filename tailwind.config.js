/**
 * Style: 「封緘研習信箱」extends the existing 五行研習桌 system.
 * Parchment surfaces, deep indigo trust anchors, restrained gold wayfinding,
 * and sober status colours support private, human-led correspondence.
 */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: '#fffdf7',
          soft: '#f7f1e5',
          aged: '#eee2cc',
          line: '#d8c9af',
          shadow: '#c7af82',
        },
        ink: {
          DEFAULT: '#183452',
          strong: '#102b48',
          muted: '#526374',
          faint: '#708090',
          inverse: '#fffdf7',
        },
        indigo: {
          DEFAULT: '#0d2a4a',
          deep: '#102e4c',
          mid: '#183f5f',
          light: '#2b5f85',
          mist: '#dce7ee',
        },
        gold: {
          DEFAULT: '#d9ab58',
          muted: '#b98d39',
          pale: '#f4dda1',
          paper: '#f3ead4',
          dark: '#765b2d',
        },
        seal: {
          DEFAULT: '#9b7330',
          deep: '#7a5c21',
          paper: '#fbf3df',
        },
        mailbox: {
          privacy: '#214f72',
          sensitive: '#8d6428',
          sensitiveBg: '#fff7df',
          ready: '#24654b',
          readyBg: '#eef7ef',
          pending: '#765b2d',
          pendingBg: '#fff8e8',
          expired: '#6f7984',
          expiredBg: '#f0f2f4',
          danger: '#8f3d36',
          dangerBg: '#fae9e6',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', '"Microsoft JhengHei"', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif TC"', '"Microsoft JhengHei"', 'serif'],
      },
      borderRadius: {
        paper: '0.5rem',
        panel: '0.75rem',
        seal: '999px',
      },
      boxShadow: {
        paper: '6px 6px 0 rgba(199, 175, 130, 0.22), 0 14px 28px rgba(24, 52, 82, 0.08)',
        'paper-lg': '12px 12px 0 rgba(199, 175, 130, 0.18), 0 24px 44px rgba(24, 52, 82, 0.12)',
        seal: '0 6px 12px rgba(118, 91, 45, 0.18)',
        inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.82)',
      },
      transitionTimingFunction: {
        'seal-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'seal-in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
    },
  },
  plugins: [],
}
