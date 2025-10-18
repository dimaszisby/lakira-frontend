import { memo } from "react";

import type { MetricPreviewVM } from "@/src/features/metrics";

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
}: MetricTableProps) => {
  return (
    <>
      <MetricDesktopTable
        metrics={metrics}
        sortBy={sortBy as keyof MetricPreviewVM}
        sortOrder={sortOrder}
        onSort={onSort}
        onEdit={onEdit}
        onDelete={onDelete}
        onRowClick={onRowClick}
        className="space-y-4"
      />

      <MetricMobileTable
        metrics={metrics}
        rowKey={(met) => met.id}
        sortBy={sortBy as keyof MetricPreviewVM}
        sortOrder={sortOrder}
        onSort={onSort}
        onEdit={onEdit}
        onDelete={onDelete}
        className="block sm:hidden"
      />
    </>
  );
};
MetricTableBase.displayName = "MetricTable";

const MetricTable = memo(MetricTableBase);
MetricTable.displayName = "MetricTable";
export default MetricTable;
