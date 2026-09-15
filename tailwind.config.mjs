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
    /* Colours replace Tailwind's default palette instead of extending it, so only
     * semantic tokens exist: `bg-white` or `text-gray-400` generate no CSS at all.
     * Raw colour values live in src/styles/tokens/palette.css. */
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",

      /* Semantic colors (HSL bodies → allow alpha) */
      bg: "hsl(var(--bg) / <alpha-value>)",
      surface: "hsl(var(--surface) / <alpha-value>)",
      surface2: "hsl(var(--surface-2) / <alpha-value>)",
      brand: {
        primary: "hsl(var(--core-primary) / <alpha-value>)",
        secondary: "hsl(var(--core-secondary) / <alpha-value>)",
        accent: "hsl(var(--core-accent) / <alpha-value>)",
      },
      "on-brand": "hsl(var(--on-brand-fg) / <alpha-value>)",
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
    extend: {
      /* Spacing 1-7 resolves through the scale tokens, so changing
       * `--space-4` in scales.css moves `p-4`, `gap-4` and `mt-4` with it.
       * Everything else (`8`, `12`, `0.5`, `px`, …) keeps Tailwind's default,
       * which is why this extends rather than replaces the scale.
       *
       * No pixel moves today: 1-6 are byte-identical to Tailwind's defaults,
       * and 7 differs (2rem against 1.75rem) but no `*-7` utility is used
       * anywhere — verified before the change. The value is that the tokens
       * are now the single source for the range they cover. */
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        7: "var(--space-7)",
      },
      fontFamily: {
        // display = Quicksand, ui = Plus Jakarta Sans
        display: ["var(--font-quicksand)", "system-ui", "sans-serif"],
        ui: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],

        // combined
        sans: ["var(--font-quicksand)", "var(--font-plus-jakarta)", "sans-serif"],

        // specific
        quicksand: ["var(--font-quicksand)", "sans-serif"],
        jakarta: ["var(--font-plus-jakarta)", "sans-serif"],
      },
      fontSize: {
        // Headings (Quicksand, Bold in utilities below)
        h1: ["3rem", { lineHeight: "1.2" }], // 48 / 57.6
        h2: ["2.25rem", { lineHeight: "1.3" }], // 36 / 46.8
        h3: ["1.75rem", { lineHeight: "1.4" }], // 28 / 39.2
        h4: ["1.5rem", { lineHeight: "1.4" }], // 24 / 33.6
        h5: ["1.25rem", { lineHeight: "1.4" }], // 20 / 28
        h6: ["1.125rem", { lineHeight: "1.3" }], // 18 / 23.4

        // Body (Plus Jakarta Sans, Regular)
        body1: ["1rem", { lineHeight: "1.6" }], // 16 / 25.6
        body2: ["0.875rem", { lineHeight: "1.6" }], // 14 / 22.4

        // Small text
        caption: ["0.75rem", { lineHeight: "1.5" }], // 12 / 18
        overline: ["0.75rem", { lineHeight: "1.167" }], // 12 / 14
        footer: ["0.75rem", { lineHeight: "1.4" }], // 12 / 16.8
        tooltip: ["0.75rem", { lineHeight: "1.3" }], // 12 / 15.6

        // Buttons / UI
        btn: ["1rem", { lineHeight: "1.2" }], // 16 / 19.2
        btnSm: ["0.875rem", { lineHeight: "1.2" }], // 14 / 16.8
        inputLg: ["0.875rem", { lineHeight: "1.2" }], // labels 14 / 16.8
        nav: ["1rem", { lineHeight: "1.3" }], // 16 / 20.8
        badge: ["0.625rem", { lineHeight: "1.2" }], // 10 / 12
        link: ["0.875rem", { lineHeight: "1.4" }], // 14 / 19.6
        alert: ["1rem", { lineHeight: "1.4" }], // 16 / 22.4
      },
      letterSpacing: {
        // keep LS=0% by default; if you later want eyebrow/overline variants, add:
        // 'overline': '0.08em',
      },
    },
  },
  plugins: [],
};

export default config;
