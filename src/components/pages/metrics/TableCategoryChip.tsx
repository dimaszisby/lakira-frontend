import { MetricPreviewCategoryDTO } from "@/features/metrics/metric.dto";
import { pickTextColor } from "@/src/utils/color";
import { memo } from "react";

const TableCategoryChip = memo(
  ({ category }: { category: MetricPreviewCategoryDTO | null }) => {
    const cat = category;
    const name = cat?.name ?? "Uncategorized";
    const icon = cat?.icon ?? "🗂️";
    const bg = cat?.color ?? "#808080";
    const text = pickTextColor(bg, { base: "#F9FAFB" });
    const textClass = text === "white" ? "text-white" : "text-black";

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-lg gap-2 whitespace-nowrap ${textClass}`}
        style={{ backgroundColor: bg }}
        aria-label="Category Chip"
      >
        <span>{icon}</span>
        <span>{name}</span>
      </span>
    );
  }
);

TableCategoryChip.displayName = "TableCategoryChip";

export default TableCategoryChip;
