import { Plus_Jakarta_Sans, Quicksand } from "next/font/google";

// Defined once and imported by both documents the app renders: the root layout and
// `global-error.tsx`, which replaces it. Each loader call hosts its own copy of the font, so a
// second call there would ship the font twice (Next's "font definitions file", `font.md`).

export const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});
