import { memo } from "react";

import type { MetricPreviewCategoryDTO } from "@/features/metrics/metric.dto";
import { pickTextColor } from "@/src/utils/color";

export const CategoryChipBase = ({ category }: { category: MetricPreviewCategoryDTO | null }) => {
  // TODO: Shared helper
  const cat = category;
  const name = cat?.name ?? "Uncategorized";
  const icon = cat?.icon ?? "🗂️";
  const bg = cat?.color ?? "#D9D9D9";
  const text = pickTextColor(bg, { base: "#F9FAFB" });
  const textClass = text === "white" ? "text-white" : "text-black";

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-1 ${textClass}`}
      style={{ backgroundColor: bg }}
      aria-label="Category Chip"
    >
      <span>{icon}</span>
      <span>{name}</span>
    </span>
  );
};
CategoryChipBase.displayName = "CategoryChip";

const CategoryChip = memo(CategoryChipBase);
CategoryChip.displayName = "CategoryChip";
export default CategoryChip;
