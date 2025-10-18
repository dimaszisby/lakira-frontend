import React, { memo } from "react";

import type { MetricCategoryVM } from "@/src/features/metric-categories/view-models";
import SwipeableCard from "@/ui/SwipeableCard";

import MetricCategoryMobileCard from "./MetricCategoryMobileCard";
import type { CategoryTableProps } from "./type";

export const MetricCategoryMobileTableBase = ({
  categories,
  rowKey = (item: MetricCategoryVM) => item.id,
  onEdit,
  onDelete,
  onRowClick,
  className = "",
}: CategoryTableProps) => {
  return (
    <div className={`block space-y-4 ${className}`}>
      {categories.length > 0 ? (
        categories.map((item) => (
          <SwipeableCard
            key={rowKey(item)}
            actions={[
              {
                label: "Edit",
                color: "bg-blue-500",
                onClick: () => onEdit?.(item),
                icon: <span>✏️</span>,
              },
              {
                label: "Delete",
                color: "bg-red-500",
                onClick: () => onDelete?.(item),
                icon: <span>🗑️</span>,
              },
            ]}
          >
            <MetricCategoryMobileCard category={item} onClick={onRowClick} />
          </SwipeableCard>
        ))
      ) : (
        <p className="py-4 text-center text-sm text-gray-500">No data available</p>
      )}
    </div>
  );
};
MetricCategoryMobileTableBase.displayName = "MetricCategoryMobileTable";

const MetricCategoryMobileTable = memo(MetricCategoryMobileTableBase);
MetricCategoryMobileTable.displayName = "MetricCategoryMobileTable";
export default MetricCategoryMobileTable;
