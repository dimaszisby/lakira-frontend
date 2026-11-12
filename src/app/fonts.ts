import localFont from "next/font/local";

// Defined once and imported by both documents the app renders: the root layout and
// `global-error.tsx`, which replaces it. Each loader call hosts its own copy of the font, so a
// second call there would ship the font twice (Next's "font definitions file", `font.md`).
//
// The files are committed under `_fonts/`, so `next build` fetches nothing (ADR-0051, #201).
// Where each comes from, its licence, and how to refresh it: `src/app/_fonts/README.md`.

// The whole font, unsubsetted: "Quicksand" is a Reserved Font Name, which a subset may not carry.
export const quicksand = localFont({
  src: "./_fonts/quicksand-wght-normal.woff2",
  weight: "300 700",
  variable: "--font-quicksand",
  display: "swap",
});

// The Latin subset only; characters outside it render in the fallback.
export const plusJakartaSans = localFont({
  src: "./_fonts/plus-jakarta-sans-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-plus-jakarta",
  display: "swap",
});
