import { memo } from "react";

import type { MetricCategoryVM } from "@/features/metric-categories/view-models";
import { cn } from "@/lib/cn";
import SwipeableCard from "@/ui/SwipeableCard";

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
  return (
    <section className={cn("space-y-4 sm:hidden", className)} aria-label="Metric categories mobile list">
      {categories.length > 0 ? (
        <ul role="list" className="space-y-4">
          {categories.map((item) => (
            <li key={rowKey(item)}>
              <SwipeableCard
                actions={[
                  {
                    label: "Edit",
                    color: "bg-status-info",
                    onClick: () => onEdit?.(item),
                    icon: <span>✏️</span>,
                  },
                  {
                    label: "Delete",
                    color: "bg-status-error",
                    onClick: () => onDelete?.(item),
                    icon: <span>🗑️</span>,
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
