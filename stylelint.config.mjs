const config = {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-tailwindcss",
    "stylelint-config-prettier",
  ],
  rules: {
    // Tailwind plugin understands @tailwind/@apply etc.
    "at-rule-no-unknown": null,
  },
  ignoreFiles: ["**/{node_modules,.next,dist,coverage}/**"],
};

export default config;
