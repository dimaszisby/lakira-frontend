import { memo } from "react";
import SwipeableCard from "@/components/ui/SwipeableCard";
import MetricLibraryMobileCard from "./MetricLibraryMobileCard";
import { MetricPreviewResponseDTO } from "@/src/features/metrics/metric.dto";
import { MetricTableProps } from "./table-config";

const MetricMobileTable = memo(
  ({
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
          <p className="text-center text-gray-500 text-sm py-4">
            No data available
          </p>
        )}
      </div>
    );
  }
);

MetricMobileTable.displayName = "MetricMobileTable";

export default MetricMobileTable;
