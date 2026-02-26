import { memo } from "react";

import { cn } from "@/lib/cn";

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
  onRowHover,
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
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          onEdit={onEdit}
          onDelete={onDelete}
          onRowClick={onRowClick}
          onRowHover={onRowHover}
        />
      ) : null}

      {showMobile ? (
        <MetricMobileTable
          metrics={metrics}
          rowKey={(met) => met.id}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          onEdit={onEdit}
          onDelete={onDelete}
          onRowClick={onRowClick}
          className={cn(variant === "mobile" ? "block" : "block sm:hidden", className)}
          onRowHover={onRowHover}
        />
      ) : null}
    </>
  );
};
MetricTableBase.displayName = "MetricTable";

const MetricTable = memo(MetricTableBase);
MetricTable.displayName = "MetricTable";
export default MetricTable;
