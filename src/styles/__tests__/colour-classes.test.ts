/**
 * @jest-environment node
 *
 * Reads source and the Tailwind config from disk; nothing is rendered.
 */

import { readFileSync } from "fs";
import { globSync } from "glob";
import path from "path";

/**
 * Every colour utility in the source must name a colour the theme defines.
 *
 * `tailwind.config.mjs` **replaces** Tailwind's palette rather than extending
 * it, so a class naming a colour the theme does not define generates no CSS at
 * all. It does not warn and it does not throw — the element simply renders
 * unstyled, which stays invisible until someone looks at that screen.
 *
 * Found on 2026-09-15: `bg-destructive/5`, `border-destructive/20` and
 * `text-destructive` in two error boundaries, plus `text-muted-foreground`
 * (a shadcn leftover) and `text-ink-600`. In the built stylesheet `destructive`
 * appears only as a *button token variable*; no such utility is generated. Both
 * error pages had been rendering with no error styling whatever — no red
 * border, no tint, no red heading — and error boundaries render rarely enough
 * that nobody noticed.
 *
 * The opacity-tint lint rule cannot catch this: `bg-destructive/5` is
 * well-formed, and the linter has no idea the colour does not exist. Checking
 * class names against the theme is what catches it.
 */

const ROOT = process.cwd();

/** Utility prefixes that resolve against `theme.colors`. */
const COLOUR_PREFIXES = [
  "text",
  "bg",
  "border",
  "ring",
  "divide",
  "outline",
  "fill",
  "stroke",
  "accent",
  "caret",
  "shadow",
] as const;

/**
 * Suffixes that follow a colour prefix but are not colours — `border-2`,
 * `text-sm`, `shadow-lg`, the named type scale, and directional border sides.
 */
const NON_COLOUR = new RegExp(
  [
    "^\\d+$",
    "^(?:xs|sm|base|md|lg|xl|\\dxl)$",
    "^(?:none|auto|full|inherit|current|transparent)$",
    "^(?:left|center|right|justify|start|end|top|bottom|middle|baseline)$",
    "^(?:solid|dashed|dotted|double|hidden|wrap|nowrap|balance|pretty|clip|ellipsis|inner)$",
    "^(?:body1|body2|caption|overline|h[1-6])$",
    "^[xytblr]$",
    "^[tblrxy]-",
  ].join("|"),
);

/**
 * Semantic classes the token system defines in CSS — `.text-body1`,
 * `.text-nav-item` and friends. They share the `text-` prefix but are type
 * styles, not colours, which is also why `tailwindcss/no-custom-classname` is
 * deliberately off. Read from the stylesheets so the list cannot drift.
 */
const readSemanticClassNames = (): Set<string> => {
  const names = new Set<string>();
  for (const file of globSync("src/styles/**/*.css", { cwd: ROOT, absolute: true })) {
    for (const match of readFileSync(file, "utf8").matchAll(/^\s*\.(?:text|bg)-([a-z0-9-]+)/gm)) {
      names.add(match[1]);
    }
  }
  return names;
};

/** Parse the `colors` block's keys. Values are irrelevant; names are the contract. */
const readDeclaredColourKeys = (configSource: string): Set<string> => {
  const block = /colors:\s*\{([\s\S]*?)\n {4}\},\n {4}extend:/.exec(configSource);
  if (!block) throw new Error("could not locate theme.colors in tailwind.config.mjs");

  const keys: string[] = [];
  const stack: string[] = [];

  for (const line of block[1].split("\n")) {
    const open = /^\s*"?([a-zA-Z][\w-]*)"?:\s*\{\s*$/.exec(line);
    if (open) {
      stack.push(open[1]);
      continue;
    }
    if (/^\s*\},?\s*$/.test(line)) {
      stack.pop();
      continue;
    }
    const leaf = /^\s*"?([a-zA-Z][\w-]*)"?:\s*["']/.exec(line);
    if (leaf) {
      const name = leaf[1] === "DEFAULT" ? stack.join("-") : [...stack, leaf[1]].join("-");
      if (name) keys.push(name);
    }
  }
  return new Set(keys);
};

describe("colour utilities resolve against the theme", () => {
  const declaredKeys = readDeclaredColourKeys(
    readFileSync(path.join(ROOT, "tailwind.config.mjs"), "utf8"),
  );
  const semanticClasses = readSemanticClassNames();

  it("reads the theme's colour keys", () => {
    // Without this, a parse that silently returned nothing would make the
    // assertion below pass vacuously — the failure mode the boundaries rule
    // had for months (see .claude/lessons.md, 2026-08-17).
    expect(declaredKeys.size).toBeGreaterThan(5);
    expect(declaredKeys.has("ink-secondary")).toBe(true);
    expect(declaredKeys.has("status-error-bg")).toBe(true);
    expect(declaredKeys.has("destructive")).toBe(false);
    expect(semanticClasses.has("body1")).toBe(true);
  });

  it("never names a colour the theme does not define", () => {
    const pattern = new RegExp(
      `\\b(?:${COLOUR_PREFIXES.join("|")})-([a-z][a-z0-9-]*?)(?:/\\d{1,3})?(?=["'\`\\s])`,
      "g",
    );

    const offenders: string[] = [];

    for (const file of globSync("src/**/*.tsx", { cwd: ROOT, absolute: true })) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(pattern)) {
        const token = match[1];
        if (NON_COLOUR.test(token) || declaredKeys.has(token) || semanticClasses.has(token)) {
          continue;
        }
        offenders.push(`${path.relative(ROOT, file)}: ${match[0]}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
