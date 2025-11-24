import { memo } from "react";

import type { MetricCategoryUI } from "@/src/features/metric-categories/view-models";
import { cn } from "@/src/lib/cn";
import { pickTextColor } from "@/utils/color";

type Variant = "primary" | "secondary";

/**
 * TODO: Refactor to use `Badge` component instead
 * CategoryChip Component
 *
 * A reusable chip component to display metric categories with customizable styles.
 *
 * Props:
 * - category: An object containing the category details (id, name, color, icon).
 * - variant: The style variant of the chip. Options are "primary" and "secondary". Default is "primary".
 *
 * Usage:
 * ```tsx
 * <CategoryChip
 *   category={{ id: "1", name: "Performance", color: "#FF5733", icon: <PerformanceIcon /> }}
 *   variant="primary"
 * />
 * ```
 */

export type Props = { category: MetricCategoryUI; variant?: Variant; className?: string };

export const CategoryChipBase = ({ category, variant = "primary", className }: Props) => {
  const textColor =
    pickTextColor(category.color) === "white" ? "text-ink-inverted dark:text-ink" : "text-ink";

  function finalBgColor(color: string, name: string) {
    if (color === "#FFFFFF" && name === "Uncategorized") {
      return "rgba(255, 255, 255, 0)"; // transparent
    }
    // Add alpha for better contrast
    if (color.startsWith("#") && (color.length === 7 || color.length === 4)) {
      return color + "33"; // 20% opacity
    }

    // Fallback: return original color
    return color;
  }

  if (variant === "secondary") {
    return (
      <span
        className={cn(
          "text-badge",
          { "bg-surface2": category.color === "#FFFFFF" && category.name === "Uncategorized" }, //only applied if uncategorized
          "rounded-md px-2 py-1",
          className,
        )}
        style={{ backgroundColor: finalBgColor(category.color, category.name) }} //only applied if NOT uncategorized
        aria-label="Category Chip"
      >
        <span className={cn(textColor)}>{category.name}</span>
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center whitespace-nowrap gap-2", className)}
      aria-label="Category Chip"
    >
      <span>{category.icon}</span>

      <span
        className={cn(textColor, "px-2 py-1 rounded-md")}
        style={{ backgroundColor: finalBgColor(category.color, category.name) }}
      >
        {category.name}
      </span>
    </span>
  );
};
CategoryChipBase.displayName = "CategoryChip";

const CategoryChip = memo(CategoryChipBase);
CategoryChip.displayName = "CategoryChip";
export default CategoryChip;
