/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/app/**/*.{ts,tsx,jsx,js,mdx}",
    "./src/components/**/*.{ts,tsx,jsx,js,mdx}",
    "./src/features/**/*.{ts,tsx,jsx,js,mdx}",
    "./src/**/*.{ts,tsx,jsx,js,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-quicksand)", "var(--font-plus-jakarta)", "sans-serif"],
        quicksand: ["var(--font-quicksand)", "sans-serif"],
        jakarta: ["var(--font-plus-jakarta)", "sans-serif"],
      },
      colors: {
        /* Semantic colors (HSL bodies → allow alpha) */
        bg: "hsl(var(--bg) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        surface2: "hsl(var(--surface-2) / <alpha-value>)",
        ink: {
          DEFAULT: "hsl(var(--text) / <alpha-value>)",
          emphasis: "hsl(var(--text-emphasis) / <alpha-value>)",
          secondary: "hsl(var(--text-secondary) / <alpha-value>)",
          tertiary: "hsl(var(--text-tertiary) / <alpha-value>)",
          inverted: "hsl(var(--text-inverted) / <alpha-value>)",
          error: "hsl(var(--text-error) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        status: {
          error: {
            bg: "hsl(var(--status-error-bg) / <alpha-value>)",
            DEFAULT: "hsl(var(--status-error) / <alpha-value>)",
            emphasis: "hsl(var(--status-error-emphasis) / <alpha-value>)",
          },
          success: {
            bg: "hsl(var(--status-success-bg) / <alpha-value>)",
            DEFAULT: "hsl(var(--status-success) / <alpha-value>)",
            emphasis: "hsl(var(--status-success-emphasis) / <alpha-value>)",
          },
          warning: {
            bg: "hsl(var(--status-warning-bg) / <alpha-value>)",
            DEFAULT: "hsl(var(--status-warning) / <alpha-value>)",
            emphasis: "hsl(var(--status-warning-emphasis) / <alpha-value>)",
          },
          info: {
            bg: "hsl(var(--status-info-bg) / <alpha-value>)",
            DEFAULT: "hsl(var(--status-info) / <alpha-value>)",
            emphasis: "hsl(var(--status-info-emphasis) / <alpha-value>)",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
