import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Plugins (Flat config style)
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import reactRefresh from "eslint-plugin-react-refresh";
import importX from "eslint-plugin-import-x";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import promise from "eslint-plugin-promise";
import security from "eslint-plugin-security";
import sonarjs from "eslint-plugin-sonarjs";
import tailwind from "eslint-plugin-tailwindcss";
import testingLibrary from "eslint-plugin-testing-library";
import jestDom from "eslint-plugin-jest-dom";
import cypress from "eslint-plugin-cypress";
import boundaries from "eslint-plugin-boundaries";
import tseslint from "@typescript-eslint/eslint-plugin";
import parserTs from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = [
  // What to ignore
  {
    ignores: [
      "**/node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "coverage/**",
      ".turbo/**",
      ".vercel/**",
      "cypress/videos/**",
      "cypress/screenshots/**",
      "documents", // currently documents only used for temp-docs
      "public/scripts/**",
    ],
  },

  // Base: Next core-web-vitals + Next TS rules
  ...nextCoreWebVitals,

  // Project-wide settings
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
        project: ["./tsconfig.json", "./cypress/tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
      globals: {
        JSX: "readonly",
      },
    },
    plugins: {
      "react-refresh": reactRefresh,
      "import-x": importX,
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
      "@typescript-eslint": tseslint,
      promise,
      security,
      sonarjs,
      tailwindcss: tailwind,
      "testing-library": testingLibrary,
      "jest-dom": jestDom,
      cypress,
      boundaries,
    },
    settings: {
      react: { version: "detect" },
      // let import-x resolve TS paths like "@/src/..."
      "import-x/resolver": {
        typescript: { project: "./tsconfig.json" },
        node: true,
      },

      // Map folders to "element types"

      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "features", pattern: "src/features/**" },
        { type: "generics", pattern: "src/generics/**" },
        { type: "types", pattern: "src/types/**" },
        { type: "utils", pattern: "src/utils/**" },
        { type: "lib", pattern: "src/lib/**" },
        { type: "services", pattern: "src/services/**" },
      ],
    },

    rules: {
      /* --- General hygiene --- */
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",

      /* --- Typescript-focused correctness --- */
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": "off", // handled by unused-imports
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
      ],

      /* --- Imports: sorted & stable --- */
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
      "import-x/consistent-type-specifier-style": ["warn", "prefer-top-level"],

      /* --- React core & hooks --- */
      "react/jsx-uses-react": "off", // React 17+
      "react/react-in-jsx-scope": "off",
      "react/function-component-definition": [
        "error",
        {
          namedComponents: "arrow-function",
          unnamedComponents: "arrow-function",
        },
      ],
      "react/jsx-no-useless-fragment": ["warn", { allowExpressions: true }],
      "react/no-unstable-nested-components": "warn",
      "react/jsx-no-leaked-render": "warn", // good for accidental hook-in-props issues
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": [
        "warn",
        {
          additionalHooks:
            "(useEvent|useDebouncedCallback|useThrottledCallback|useMemoizedCallback)",
        },
      ],

      /* --- Enforce our memo pattern (disallow inline anonymous in memo) --- */
      // Prefer: define component first, then wrap at export: export default memo(Component)
      "no-restricted-syntax": [
        "error",
        // default export: React.memo(() => ...)
        {
          selector:
            'ExportDefaultDeclaration > CallExpression[callee.object.name="React"][callee.property.name="memo"] > ArrowFunctionExpression',
          message: "Name the component first, then wrap with memo at export.",
        },
        // default export: memo(() => ...)
        {
          selector:
            'ExportDefaultDeclaration > CallExpression[callee.name="memo"] > ArrowFunctionExpression',
          message: "Name the component first, then wrap with memo at export.",
        },
        // const X = memo(() => ...);
        {
          selector:
            'VariableDeclarator[init.type="CallExpression"][init.callee.name="memo"] > ArrowFunctionExpression',
          message:
            "Avoid inline anonymous components inside memo(). Define the component (named) first.",
        },
      ],

      /* --- React Fast Refresh safety --- */
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      /* --- A11y + Tailwind ergonomics --- */
      "jsx-a11y/alt-text": "warn",
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/no-contradicting-classname": "error",
      // If you heavily use custom classnames/tokens, keep this off to avoid noise:
      "tailwindcss/no-custom-classname": "off",

      /* --- Promises & async best practices --- */
      "promise/catch-or-return": "warn",
      "promise/no-nesting": "warn",

      /* --- Bug/footgun scanners --- */
      "sonarjs/no-duplicate-string": "warn",
      "sonarjs/prefer-immediate-return": "warn",
      // Security plugin can be noisy for FE; keep the best ones on
      "security/detect-object-injection": "off",

      // ▼ added: enforce dependency direction
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            // app (Next.js routes) can depend on everything below it
            {
              from: "app",
              allow: ["features", "services", "lib", "utils", "generics"],
            },

            // features can use cross-cutting libs & pure utils/types
            { from: "features", allow: ["services", "lib", "utils", "types", "generics"] },

            // components can use cross-cutting libs & pure utils/types
            { from: "components", allow: ["lib", "utils", "types", "generics"] },

            // services can use cross-cutting libs & pure utils/types
            { from: "services", allow: ["lib", "utils", "types", "generics"] },

            // lib can only depend on utils & generics (no feature imports)
            { from: "lib", allow: ["utils", "types", "generics"] },

            // utils can only depend on generics
            { from: "utils", allow: ["generics"] },

            // types can only depend on generics
            { from: "types", allow: ["generics"] },

            // generics (type-only) depends on nothing inside the repo
            { from: "generics", allow: [] },
          ],
        },
      ],
    },
  },

  /* Test files (React Testing Library | Jest DOM) */
  {
    files: ["**/*.{test,spec}.{ts,tsx}"],
    rules: {
      "boundaries/element-types": "off",
      "testing-library/no-await-sync-events": "warn",
      "testing-library/no-debugging-utils": "warn",
      "testing-library/no-node-access": "off",
      "jest-dom/prefer-enabled-disabled": "warn",
      "jest-dom/prefer-checked": "warn",
      "jest-dom/prefer-to-have-text-content": "warn",
    },
  },

  /* Cypress e2e */
  {
    files: ["cypress/**/*.{ts,tsx,js}"],
    plugins: { cypress },
    languageOptions: { globals: { cy: "readonly", Cypress: "readonly" } },
    rules: {
      "boundaries/element-types": "off",
      "cypress/no-assigning-return-values": "error",
      "cypress/no-unnecessary-waiting": "warn",
      "cypress/assertion-before-screenshot": "warn",
    },
  },
];

export default config;
