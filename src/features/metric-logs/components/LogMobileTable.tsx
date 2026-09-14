import { PencilSimple, Trash } from "@phosphor-icons/react";
import { memo } from "react";

import type { MetricLogVM } from "@/features/metric-logs/view-models";
import { cn } from "@/lib/cn";
import { SwipeableCard } from "@/ui/SwipeableCard";

import LogMobileCard from "./LogMobileCard";
import type { LogTableProps } from "./table-config";

export const LogMobileTableBase = ({
  logs,
  rowKey = (item: MetricLogVM) => item.id,
  onEdit,
  onDelete,
  onRowClick,
  className = "",
  mobileClassName,
}: LogTableProps) => {
  return (
    <section className={cn("space-y-4 sm:hidden", className)} aria-label="Metric logs mobile list">
      {logs.length > 0 ? (
        <ul role="list" className="space-y-4">
          {logs.map((item) => (
            <li key={rowKey(item)}>
              <SwipeableCard
                className={mobileClassName}
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
                <LogMobileCard log={item} onClick={onRowClick} />
              </SwipeableCard>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-center text-sm text-ink-secondary" role="status">
          No logs available
        </p>
      )}
    </section>
  );
};
LogMobileTableBase.displayName = "LogMobileTable";

const LogMobileTable = memo(LogMobileTableBase);
LogMobileTable.displayName = "LogMobileTable";

export default LogMobileTable;
