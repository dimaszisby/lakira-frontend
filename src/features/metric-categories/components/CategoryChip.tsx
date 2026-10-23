import { memo } from "react";

import { categoryColorStyle } from "@/features/metric-categories/categoryColorStyle";
import { CATEGORY_DEFAULTS } from "@/features/metric-categories/constants";
import type { MetricCategoryUI } from "@/features/metric-categories/view-models";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary";

export type Props = { category: MetricCategoryUI; variant?: Variant; className?: string };

const HEX_COLOR = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const isDefaultFallback = (category: MetricCategoryUI) => {
  return category.name === CATEGORY_DEFAULTS.name && category.color === "#FFFFFF";
};

export const CategoryChipBase = ({ category, variant = "primary", className }: Props) => {
  // The recipe tints the colour over a fixed base per theme, so the theme's ink always meets
  // 4.5:1 on it (ADR-0040). A colour the recipe could not mix gets the fallback's token styling.
  const fallbackCategory = isDefaultFallback(category) || !HEX_COLOR.test(category.color.trim());
  const bgColor = fallbackCategory ? "transparent" : category.color.trim();

  const labelPill = (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-sm font-medium text-ink",
        fallbackCategory ? "border border-border bg-surface2" : "border border-transparent",
        !fallbackCategory && "category-color-bg",
      )}
      style={categoryColorStyle(bgColor)}
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
