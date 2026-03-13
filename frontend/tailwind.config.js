module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dark: '#0a0a0f',
        card: '#13131a',
        sentinel: '#ef4444',
        stranger: '#3b82f6',
        oracle: '#f59e0b',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
