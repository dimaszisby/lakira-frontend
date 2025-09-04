import React from "react";
import SwipeableCard from "@/components/ui/SwipeableCard";
import { MetricLogResponseDTO } from "@/src/types/dtos/metric-log.dto";
import { LogTableProps } from "./types";
import LogMobileCard from "./LogMobileCard";

const LogMobileTable = React.memo(
  ({
    logs,
    rowKey = (item: MetricLogResponseDTO) => item.id,
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
          <p className="text-center text-gray-500 text-sm py-4">
            No data available
          </p>
        )}
      </div>
    );
  }
);

LogMobileTable.displayName = "LogMobileTable";

export default LogMobileTable;
