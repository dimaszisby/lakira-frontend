import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The named type scale from `tailwind.config.mjs`. tailwind-merge only knows
 * Tailwind's default sizes, so without this `cn("text-caption", "text-ink")`
 * treats `text-caption` as a colour and silently drops it.
 */
const FONT_SIZES = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "body1",
  "body2",
  "caption",
  "overline",
  "footer",
  "tooltip",
  "btn",
  "btnSm",
  "inputLg",
  "nav",
  "badge",
  "link",
  "alert",
];

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: FONT_SIZES,
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
