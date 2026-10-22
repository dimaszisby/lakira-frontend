/**
 * @jest-environment node
 *
 * Reads the token files from disk; nothing is rendered.
 */

import { readFileSync } from "fs";
import path from "path";

/**
 * A category chip's text meets WCAG 1.4.3's 4.5:1 for every colour a user can pick.
 *
 * `.category-color-bg` mixes 20 % of the user's colour into `--tint-base`, and the chip's text is
 * the theme's `--text` (ADR-0040). The colour is user data, so no single pairing can be checked;
 * this computes the worst case over a grid of colours from the tokens themselves, so a later
 * change to `--tint-base` or `--text` that breaks the guarantee fails here. The translucent tint
 * it replaced measured 4.12:1 in the dark metrics table (register row F-56).
 */

const TOKENS = path.join(process.cwd(), "src/styles/tokens");
const read = (file: string) => readFileSync(path.join(TOKENS, file), "utf8");

// The share of the user's colour in `category-color.recipe.css`.
const TINT = 0.2;
const MIN_RATIO = 4.5;

type RGB = [number, number, number];

// Comments go first: "Equal to --text: h5/h6 ..." in `semantic.css` reads as a declaration.
const declarations = (css: string) =>
  new Map(
    [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(
      ([, name, value]) => [name, value],
    ),
  );

const themeBlock = (css: string, theme: "light" | "dark") => {
  const start = css.indexOf(`:root[data-theme="${theme}"] {`);
  if (start < 0) throw new Error(`no ${theme} block in semantic.css`);
  return css.slice(start, css.indexOf("}", start));
};

const hslToRgb = (body: string): RGB => {
  const [h, s, l] = body.trim().split(/\s+/).map(parseFloat);
  const sat = s / 100;
  const lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255)) as RGB;
};

const palette = declarations(read("palette.css"));
const semantic = read("semantic.css");

/** A semantic token's colour in one theme, followed through `var()` to the palette. */
const resolve = (token: string, theme: "light" | "dark"): RGB => {
  const scope = declarations(themeBlock(semantic, theme));
  let value = scope.get(token);
  if (!value) throw new Error(`${token} is not defined for the ${theme} theme`);
  for (let hops = 0; hops < 5; hops += 1) {
    const ref = /^var\((--[\w-]+)\)$/.exec(value.trim());
    if (!ref) break;
    value = scope.get(ref[1]) ?? palette.get(ref[1]) ?? "";
  }
  return hslToRgb(value);
};

const luminance = (rgb: RGB) => {
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: RGB, b: RGB) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const mix = (color: RGB, base: RGB): RGB =>
  color.map((c, i) => TINT * c + (1 - TINT) * base[i]) as RGB;

// 18 steps per channel, 0 to 255: 5,832 colours, the extremes included.
const STEPS = Array.from({ length: 18 }, (_, i) => i * 15);
const GRID: RGB[] = STEPS.flatMap((r) => STEPS.flatMap((g) => STEPS.map((b) => [r, g, b] as RGB)));

describe("category chip contrast", () => {
  it.each(["light", "dark"] as const)(
    "keeps the chip's text at 4.5:1 or more for every colour in the %s theme",
    (theme) => {
      const base = resolve("--tint-base", theme);
      const ink = resolve("--text", theme);

      const worst = Math.min(...GRID.map((color) => contrast(ink, mix(color, base))));

      expect(worst).toBeGreaterThanOrEqual(MIN_RATIO);
    },
  );
});
