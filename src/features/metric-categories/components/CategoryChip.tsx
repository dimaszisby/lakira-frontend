import { memo } from "react";

import { CATEGORY_DEFAULTS } from "@/features/metric-categories/constants";
import type { MetricCategoryUI } from "@/features/metric-categories/view-models";
import { cn } from "@/lib/cn";
import { pickTextColor } from "@/utils/color";

type Variant = "primary" | "secondary";

export type Props = { category: MetricCategoryUI; variant?: Variant; className?: string };

const parseHexToRgb = (hexColor: string) => {
  const hex = hexColor.trim();
  const short = /^#([0-9A-Fa-f]{3})$/.exec(hex);
  if (short) {
    const [r, g, b] = short[1].split("").map((value) => parseInt(value + value, 16));
    return { r, g, b };
  }

  const full = /^#([0-9A-Fa-f]{6})$/.exec(hex);
  if (!full) return null;
  const int = parseInt(full[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

const toTintedBg = (color: string, alpha = 0.2) => {
  const rgb = parseHexToRgb(color);
  if (!rgb) return "transparent";
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const isDefaultFallback = (category: MetricCategoryUI) => {
  return category.name === CATEGORY_DEFAULTS.name && category.color === "#FFFFFF";
};

export const CategoryChipBase = ({ category, variant = "primary", className }: Props) => {
  const fallbackCategory = isDefaultFallback(category);
  const bgColor = fallbackCategory ? "transparent" : toTintedBg(category.color);
  const textTone = pickTextColor(bgColor) === "white" ? "text-ink-inverted" : "text-ink";

  const labelPill = (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-sm font-medium",
        textTone,
        fallbackCategory ? "border border-border bg-surface2" : "border border-transparent",
      )}
      style={{ backgroundColor: bgColor }}
      title={category.name}
    >
      {category.name}
    </span>
  );

  if (variant === "secondary") {
    return (
      <span
        className={cn("inline-flex items-center", className)}
        aria-label={`Category ${category.name}`}
        data-variant={variant}
      >
        {labelPill}
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center gap-2 whitespace-nowrap", className)}
      aria-label={`Category ${category.name}`}
      data-variant={variant}
    >
      <span aria-hidden="true">{category.icon}</span>
      {labelPill}
    </span>
  );
};
CategoryChipBase.displayName = "CategoryChip";

const CategoryChip = memo(CategoryChipBase);
CategoryChip.displayName = "CategoryChip";
export default CategoryChip;
