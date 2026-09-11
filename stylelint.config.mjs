const config = {
  extends: ["stylelint-config-standard", "stylelint-config-tailwindcss"],
  rules: {
    // Tailwind plugin understands @tailwind/@apply etc.
    "at-rule-no-unknown": null,

    // Raw colour values live only in tokens/palette.css; everything else
    // references semantic or component tokens.
    "color-no-hex": true,
    "color-named": "never",
    "function-disallowed-list": ["rgb", "rgba"],

    // Recipes read the named type scale from tailwind.config.mjs through theme(),
    // which Stylelint cannot resolve.
    "declaration-property-value-no-unknown": [
      true,
      { ignoreProperties: { "/.+/": ["/^theme\\(/"] } },
    ],
  },
  overrides: [
    {
      files: ["src/styles/tokens/palette.css"],
      rules: {
        "color-no-hex": null,
        "color-named": null,
        "function-disallowed-list": null,
      },
    },
    {
      // Shadow scale values need an rgb() shadow colour.
      files: ["src/styles/tokens/scales.css"],
      rules: {
        "function-disallowed-list": null,
      },
    },
  ],
  ignoreFiles: ["**/{node_modules,.next,dist,coverage}/**"],
};

export default config;
