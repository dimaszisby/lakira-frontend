import React from "react";

import SwipeableCard from "@/components/ui/SwipeableCard";
import type { MetricLogVM } from "@/src/features/metric-logs/view-models";

import LogMobileCard from "./LogMobileCard";
import type { LogTableProps } from "./table-config";

const LogMobileTable = React.memo(
  ({
    logs,
    rowKey = (item: MetricLogVM) => item.id,
    onEdit,
    onDelete,
    onRowClick,
    className = "",
  }: LogTableProps) => {
    return (
      <div className={`block space-y-4 ${className}`}>
        {logs.length > 0 ? (
          logs.map((item) => (
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
              <LogMobileCard log={item} onClick={onRowClick} />
            </SwipeableCard>
          ))
        ) : (
          <p className="py-4 text-center text-sm text-gray-500">No data available</p>
        )}
      </div>
    );
  },
);

LogMobileTable.displayName = "LogMobileTable";

export default LogMobileTable;
