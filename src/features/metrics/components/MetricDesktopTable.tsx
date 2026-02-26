import { memo } from "react";

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
  onRowHover,
  className,
}: MetricTableProps) => {
  return (
    <TableBase
      data={metrics}
      columns={desktopColumns}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      rowKey={(cat) => cat.id}
      onEdit={onEdit}
      onDelete={onDelete}
      onRowClick={onRowClick}
      onRowHover={onRowHover}
      className={className}
      ariaLabel="Metrics table"
      emptyMessage="No metrics available"
      // Optionally: custom row component for editing/deleting per row
      // renderRow={(category) => <MetricCategoryTableRow key={category.id} category={category} />}
    />
  );
};
MetricDesktopTableBase.displayName = "MetricDesktopTable";

const MetricDesktopTable = memo(MetricDesktopTableBase);
MetricDesktopTable.displayName = "MetricDesktopTable";
export default MetricDesktopTable;
