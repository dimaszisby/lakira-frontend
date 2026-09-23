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

/* Enforce our memo pattern (disallow inline anonymous components in memo).
 * Shared by every block that sets no-restricted-syntax, because a later block
 * replaces the rule's whole option list rather than adding to it. */
const memoComponentSelectors = [
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
    message: "Avoid inline anonymous components inside memo(). Define the component (named) first.",
  },
];

/* A colour utility with an opacity modifier, e.g. "bg-surface/60". esquery regexes
 * cannot contain a literal slash, hence \x2F. */
const OPACITY_TINT_PATTERN =
  "/\\b(bg|text|border|ring|divide|outline|fill|stroke|from|via|to|shadow|placeholder)-[a-z0-9-]+\\x2F[0-9]+/";
const TINT_MESSAGE =
  "Opacity tints belong in a token recipe (src/styles/tokens/components), not a class string.";

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
        { type: "components", pattern: "src/components/**" },
        { type: "constants", pattern: "src/constants/**" },
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
      "no-restricted-syntax": ["error", ...memoComponentSelectors],

      /* --- React Fast Refresh safety --- */
      // Next.js route files must export these alongside the component.
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: ["metadata", "generateMetadata", "viewport", "generateViewport"],
        },
      ],

      /* --- A11y --- */
      /* The recommended jsx-a11y set, as errors. `eslint-config-next` already
       * registers the plugin; only `alt-text` was ever switched on, which is why
       * `.claude/rules/accessibility.md` warns not to read a passing lint run as
       * a passing a11y check.
       *
       * Turning the rest on found no defects — all five hits were correct code
       * the rules cannot see the intent of, and carry disable comments giving
       * the reason. The value is forward-looking: these catch the next
       * `<div onClick>` before review does. Listed explicitly rather than spread
       * from the preset so that adding a rule is a visible decision.
       */
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-activedescendant-has-tabindex": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/autocomplete-valid": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/html-has-lang": "error",
      "jsx-a11y/iframe-has-title": "error",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/mouse-events-have-key-events": "error",
      "jsx-a11y/no-access-key": "error",
      "jsx-a11y/no-autofocus": "error",
      "jsx-a11y/no-distracting-elements": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "error",
      "jsx-a11y/no-noninteractive-tabindex": "error",
      /* Off, deliberately. Its common case is `role="list"` on a `<ul>`, which
       * is NOT redundant here: Tailwind's preflight sets `list-style: none` on
       * every ul, and Safari + VoiceOver drop list semantics from a list styled
       * that way — item count and boundaries stop being announced. The three
       * mobile lists restate the role for exactly that reason, so enabling this
       * rule would push someone to remove them and regress screen-reader output.
       */
      "jsx-a11y/no-redundant-roles": "off",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/scope": "error",
      "jsx-a11y/tabindex-no-positive": "error",

      /* --- Tailwind ergonomics --- */
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
              allow: [
                "features",
                "components",
                "services",
                "lib",
                "utils",
                "generics",
                "constants",
              ],
            },

            // features can use shared UI primitives, cross-cutting libs & pure utils/types
            {
              from: "features",
              allow: ["components", "services", "lib", "utils", "types", "generics", "constants"],
            },

            // components can use cross-cutting libs & pure utils/types
            { from: "components", allow: ["lib", "utils", "types", "generics", "constants"] },

            // services can use cross-cutting libs & pure utils/types
            { from: "services", allow: ["lib", "utils", "types", "generics", "constants"] },

            // lib can only depend on utils & generics (no feature imports)
            { from: "lib", allow: ["utils", "types", "generics", "constants"] },

            // utils can only depend on generics
            { from: "utils", allow: ["generics", "constants"] },

            // types can only depend on generics
            { from: "types", allow: ["generics", "constants"] },

            // generics (type-only) depends on nothing inside the repo
            { from: "generics", allow: [] },

            // constants are leaf values: importable everywhere, importing nothing
            { from: "constants", allow: ["constants"] },
          ],
        },
      ],
    },
  },

  /* Shared UI primitives: styling lives in token and recipe CSS, never in the component.
   * See .claude/rules/styling.md. Colours outside the token set are already impossible
   * (tailwind.config.mjs replaces the default palette); these rules close the rest. */
  {
    files: ["src/components/ui/**/*.tsx"],
    ignores: ["src/components/ui/**/__tests__/**"],
    settings: {
      tailwindcss: { callees: ["cn", "clsx", "classnames"] },
    },
    rules: {
      /* Primitives have no business reaching for an escape hatch: everything
       * they need is a token. This stays scoped to `ui/` deliberately — a page
       * may legitimately need `min-h-[50vh]` or `[scrollbar-width:none]`, which
       * are viewport units and raw CSS properties the token system does not
       * model, not colour or spacing bypasses. */
      "tailwindcss/no-arbitrary-value": "error",
    },
  },

  /* Token discipline, everywhere a component is written.
   *
   * These two rules protect the token system's actual jurisdiction — colour —
   * so they apply far wider than the primitives. An ad-hoc tint produces a
   * colour that exists in no token, so nothing can check its contrast and dark
   * mode cannot override it independently; a non-custom-property inline style
   * puts styling in the markup where no recipe can reach it.
   *
   * Widened from `ui/` on 2026-09-15. See .claude/rules/styling.md. */
  {
    files: [
      "src/components/ui/**/*.tsx",
      "src/components/layout/**/*.tsx",
      "src/features/**/*.tsx",
      "src/app/**/*.tsx",
    ],
    ignores: ["src/**/__tests__/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...memoComponentSelectors,
        { selector: `Literal[value=${OPACITY_TINT_PATTERN}]`, message: TINT_MESSAGE },
        { selector: `TemplateElement[value.raw=${OPACITY_TINT_PATTERN}]`, message: TINT_MESSAGE },
        {
          selector:
            "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression > Property[key.type='Identifier']",
          message:
            'Inline styles may only set CSS custom properties (e.g. { "--swatch": hex }) that a recipe reads.',
        },
      ],
    },
  },

  /* Known layer inversions, quarantined.
   *
   * These files live in `components` but reach up into `features`/`services`.
   * The boundary rule was inert until 2026-08-17 (src/components/** was never
   * mapped in boundaries/elements), so this debt accumulated unseen.
   *
   * Tracked in docs/internal/todos/2026-08-17-todo-claude-code-setup.md:
   * Header and Sidebar are app-shell concerns that need auth state; they belong
   * under src/app/ or need state injected.
   *
   * The list has only ever shrunk. CategorySelect and Visualization moved into
   * their feature modules on 2026-09-11; withAuth and HydrateUser were deleted
   * on 2026-09-22 — both were dead, and withAuth's job was already done by
   * src/proxy.ts, (app)/layout.tsx and useAuthProfileQuery.
   *
   * Do not add to this list. New code must satisfy the boundary rule.
   */
  {
    files: ["src/components/layout/Header.tsx", "src/components/layout/Sidebar.tsx"],
    rules: {
      "boundaries/element-types": "off",
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
