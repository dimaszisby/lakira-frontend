import { memo } from "react";

import type { MetricPreviewResponseDTO } from "@/features/metrics/metric.dto";
import { TableBase } from "@/ui/Table";

import type { MetricTableProps } from "./table-config";
import { desktopColumns } from "./table-config";

export const MetricDesktopTableBase = ({
  metrics,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onRowClick,
}: MetricTableProps) => {
  return (
    <TableBase
      data={metrics}
      columns={desktopColumns}
      sortBy={sortBy as keyof MetricPreviewResponseDTO}
      sortOrder={sortOrder}
      onSort={onSort} // Dev Note: recently changed
      rowKey={(cat) => cat.id}
      onEdit={onEdit}
      onDelete={onDelete}
      onRowClick={onRowClick}
      // Optionally: custom row component for editing/deleting per row
      // renderRow={(category) => <MetricCategoryTableRow key={category.id} category={category} />}
    />
  );
};
MetricDesktopTableBase.displayName = "MetricDesktopTable";

const MetricDesktopTable = memo(MetricDesktopTableBase);
MetricDesktopTable.displayName = "MetricDesktopTable";
export default MetricDesktopTable;
