import { memo } from "react";

import { cn } from "@/lib/cn";
import { Table } from "@/ui/Table";

import type { MetricTableProps } from "./table-config";
import { desktopColumns } from "./table-config";

export const MetricDesktopTableBase = ({
  metrics,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  onRowHover,
  className,
}: MetricTableProps) => {
  return (
    <Table
      data={metrics}
      columns={desktopColumns}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      rowKey={(cat) => cat.id}
      onRowClick={onRowClick}
      onRowHover={onRowHover}
      className={cn("hidden sm:block", className)}
      aria-label="Metrics table"
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
