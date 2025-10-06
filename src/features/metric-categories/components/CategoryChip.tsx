import { memo } from "react";

import type { MetricCategoryUI } from "@/src/features/metric-categories/view-models";
import { pickTextColor } from "@/utils/color";

export type Props = { category: MetricCategoryUI };

export const CategoryChipBase = ({ category }: Props) => {
  const text =
    pickTextColor(category.color, { base: "#F9FAFB" }) === "white" ? "text-white" : "text-black";

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-1 ${text}`}
      style={{ backgroundColor: category.color }}
      aria-label="Category Chip"
    >
      <span>{category.icon}</span>
      <span>{category.name}</span>
    </span>
  );
};
CategoryChipBase.displayName = "CategoryChip";

const CategoryChip = memo(CategoryChipBase);
CategoryChip.displayName = "CategoryChip";
export default CategoryChip;
