import { memo } from "react";

import type { MetricPreviewResponseDTO } from "@/features/metrics/metric.dto";
import SwipeableCard from "@/ui/SwipeableCard";

import MetricLibraryMobileCard from "./MetricLibraryMobileCard";
import type { MetricTableProps } from "./table-config";

export const MetricMobileTableBase = ({
  metrics,
  rowKey = (item: MetricPreviewResponseDTO) => item.id,
  onEdit,
  onDelete,
  onRowClick,
  className = "",
}: MetricTableProps) => {
  return (
    <div className={`block space-y-4 ${className}`}>
      {metrics.length > 0 ? (
        metrics.map((item) => (
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
            <MetricLibraryMobileCard metric={item} onClick={onRowClick} />
          </SwipeableCard>
        ))
      ) : (
        <p className="py-4 text-center text-sm text-gray-500">No data available</p>
      )}
    </div>
  );
};
MetricMobileTableBase.displayName = "MetricMobileTable";

const MetricMobileTable = memo(MetricMobileTableBase);
MetricMobileTable.displayName = "MetricMobileTable";
export default MetricMobileTable;
