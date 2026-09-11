import { PencilSimple, Trash } from "phosphor-react";
import { memo } from "react";

import type { MetricPreviewVM } from "@/features/metrics/view-models";
import { cn } from "@/lib/cn";
import { SwipeableCard } from "@/ui/SwipeableCard";

import MetricLibraryMobileCard from "./MetricLibraryMobileCard";
import type { MetricTableProps } from "./table-config";

export const MetricMobileTableBase = ({
  metrics,
  rowKey = (item: MetricPreviewVM) => item.id,
  onEdit,
  onDelete,
  onRowClick,
  onRowHover,
  className = "",
}: MetricTableProps) => {
  return (
    <section className={cn("space-y-4 sm:hidden", className)} aria-label="Metrics mobile list">
      {metrics.length > 0 ? (
        <ul role="list" className="space-y-4">
          {metrics.map((item) => (
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
                <MetricLibraryMobileCard
                  metric={item}
                  onClick={onRowClick}
                  onPrefetch={onRowHover}
                />
              </SwipeableCard>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-center text-sm text-ink-secondary" role="status">
          No metrics available
        </p>
      )}
    </section>
  );
};
MetricMobileTableBase.displayName = "MetricMobileTable";

const MetricMobileTable = memo(MetricMobileTableBase);
MetricMobileTable.displayName = "MetricMobileTable";
export default MetricMobileTable;
