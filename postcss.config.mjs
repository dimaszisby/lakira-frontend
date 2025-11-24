// postcss.config.mjs
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "postcss-import": {}, // enables @import support in your CSS
    tailwindcss: {}, // Tailwind
    autoprefixer: {}, // Autoprefixer
  },
};

export default config;
