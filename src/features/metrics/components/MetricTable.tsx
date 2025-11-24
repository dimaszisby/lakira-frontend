import { memo } from "react";

import type { MetricPreviewVM } from "@/src/features/metrics";
import { cn } from "@/src/lib/cn";

import MetricDesktopTable from "./MetricDesktopTable";
import MetricMobileTable from "./MetricMobileTable";
import type { MetricTableProps } from "./table-config";

export const MetricTableBase = ({
  metrics,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onRowClick,
  className,
  variant = "both",
}: MetricTableProps) => {
  const showDesktop = variant === "desktop" || variant === "both";
  const showMobile = variant === "mobile" || variant === "both";

  return (
    <>
      {showDesktop ? (
        <MetricDesktopTable
          metrics={metrics}
          sortBy={sortBy as keyof MetricPreviewVM}
          sortOrder={sortOrder}
          onSort={onSort}
          onEdit={onEdit}
          onDelete={onDelete}
          onRowClick={onRowClick}
        />
      ) : null}

      {showMobile ? (
        <MetricMobileTable
          metrics={metrics}
          rowKey={(met) => met.id}
          sortBy={sortBy as keyof MetricPreviewVM}
          sortOrder={sortOrder}
          onSort={onSort}
          onEdit={onEdit}
          onDelete={onDelete}
          className={cn(variant === "mobile" ? "block" : "block sm:hidden", className)}
        />
      ) : null}
    </>
  );
};
MetricTableBase.displayName = "MetricTable";

const MetricTable = memo(MetricTableBase);
MetricTable.displayName = "MetricTable";
export default MetricTable;
