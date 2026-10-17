import { PencilSimple, Trash } from "@phosphor-icons/react";
import { memo } from "react";

import type { MetricCategoryVM } from "@/features/metric-categories/view-models";
import { cn } from "@/lib/cn";
import { SwipeableCard } from "@/ui/SwipeableCard";

import MetricCategoryMobileCard from "./MetricCategoryMobileCard";
import type { CategoryTableProps } from "./table-config";

export const MetricCategoryMobileTableBase = ({
  categories,
  rowKey = (item: MetricCategoryVM) => item.id,
  onEdit,
  onDelete,
  onRowClick,
  className = "",
}: CategoryTableProps) => {
  // No breakpoint class of its own: `MetricCategoryTable` decides when this list shows. The same
  // class on `MetricMobileTable` left the metrics list blank from 640 px up until 2026-10-07.
  return (
    <section className={cn("space-y-4", className)} aria-label="Metric categories mobile list">
      {categories.length > 0 ? (
        <ul role="list" className="space-y-4">
          {categories.map((item) => (
            <li key={rowKey(item)}>
              <SwipeableCard
                actions={[
                  {
                    label: "Edit",
                    tone: "info",
                    onClick: () => onEdit?.(item),
                    icon: <PencilSimple weight="bold" aria-hidden />,
                  },
                  {
                    label: "Delete",
                    tone: "danger",
                    onClick: () => onDelete?.(item),
                    icon: <Trash weight="bold" aria-hidden />,
                  },
                ]}
              >
                <MetricCategoryMobileCard category={item} onClick={onRowClick} />
              </SwipeableCard>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-center text-sm text-ink-secondary" role="status">
          No categories available
        </p>
      )}
    </section>
  );
};
MetricCategoryMobileTableBase.displayName = "MetricCategoryMobileTable";

const MetricCategoryMobileTable = memo(MetricCategoryMobileTableBase);
MetricCategoryMobileTable.displayName = "MetricCategoryMobileTable";
export default MetricCategoryMobileTable;
