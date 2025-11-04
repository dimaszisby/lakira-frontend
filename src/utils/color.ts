export type RGB = { r: number; g: number; b: number; a?: number };

const cache = new Map<string, "white" | "black">();

function hexToRgb(hex: string): RGB | null {
  const m = hex.trim().toLowerCase();
  const short = /^#([0-9a-f]{3})$/i.exec(m);
  if (short) {
    const [r, g, b] = short[1].split("").map((ch) => parseInt(ch + ch, 16));
    return { r, g, b, a: 1 };
  }
  const long = /^#([0-9a-f]{6})$/i.exec(m);
  if (long) {
    const int = parseInt(long[1], 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255, a: 1 };
  }
  return null;
}

function rgbFuncToRgb(input: string): RGB | null {
  const m = input.trim().match(/^rgba?\((.+)\)$/i);
  if (!m) return null;
  const parts = m[1].split(",").map((p) => p.trim());
  if (parts.length < 3) return null;
  const [r, g, b] = parts.slice(0, 3).map((v) => Number(v));
  const a = parts[3] !== undefined ? Number(parts[3]) : 1;
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b, a: Number.isNaN(a) ? 1 : a };
}

function parseColor(input: string): RGB | null {
  return hexToRgb(input) ?? rgbFuncToRgb(input);
}

function blendOver(bg: RGB, base: RGB): RGB {
  const a = bg.a ?? 1;
  const inv = 1 - a;
  return {
    r: Math.round(bg.r * a + base.r * inv),
    g: Math.round(bg.g * a + base.g * inv),
    b: Math.round(bg.b * a + base.b * inv),
    a: 1,
  };
}

function srgbToLinear(c: number) {
  const cs = c / 255;
  return cs <= 0.04045 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function relativeLuminance({ r, g, b }: RGB) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(L1: number, L2: number) {
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
}

/**
 * Pick accessible text color (black/white) for a given background.
 * Uses WCAG contrast against the given base surface (default #ffffff).
 */
export function pickTextColor(
  bgColor: string,
  opts?: { base?: string; minRatio?: number },
): "white" | "black" {
  const baseHex = opts?.base ?? "#ffffff"; // page surface; Tailwind gray-50 ≈ #F9FAFB if you prefer
  const minRatio = opts?.minRatio ?? 4.5;

  const key = `${bgColor}|${baseHex}|${minRatio}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const bg = parseColor(bgColor);
  const base = parseColor(baseHex) ?? { r: 255, g: 255, b: 255, a: 1 };
  if (!bg) {
    cache.set(key, "black");
    return "black"; // sensible default for light surfaces
  }

  const opaqueBg = (bg.a ?? 1) < 1 ? blendOver(bg, base) : bg;
  const Lbg = relativeLuminance(opaqueBg);

  const Lwhite = relativeLuminance({ r: 255, g: 255, b: 255 });
  const Lblack = relativeLuminance({ r: 0, g: 0, b: 0 });

  const crWhite = contrastRatio(Lwhite, Lbg);
  const crBlack = contrastRatio(Lblack, Lbg);

  const result = crWhite >= minRatio || crWhite > crBlack ? "white" : "black";

  cache.set(key, result);
  return result;
}
