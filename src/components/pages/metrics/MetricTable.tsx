import { memo } from "react";

import type { MetricPreviewResponseDTO } from "@/features/metrics/metric.dto";

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
      {/* Desktop view */}
      <MetricDesktopTable
        metrics={metrics}
        sortBy={sortBy as keyof MetricPreviewResponseDTO}
        sortOrder={sortOrder}
        onSort={onSort}
        onEdit={onEdit}
        onDelete={onDelete}
        onRowClick={onRowClick}
        className="space-y-4"
      />

      {/* Mobile view */}
      <MetricMobileTable
        metrics={metrics}
        rowKey={(met) => met.id}
        sortBy={sortBy as keyof MetricPreviewResponseDTO}
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
