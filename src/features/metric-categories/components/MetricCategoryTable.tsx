import { memo } from "react";

import MetricCategoryDesktopTable from "./MetricCategoryDesktopTable";
import MetricCategoryMobileTable from "./MetricCategoryMobileTable";
import type { CategoryTableProps } from "./table-config";

export const MetricCategoryTableBase = ({
  categories,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onRowClick,
}: CategoryTableProps) => {
  return (
    <>
      {/* Desktop view */}
      <MetricCategoryDesktopTable
        categories={categories}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        onEdit={onEdit}
        onDelete={onDelete}
        onRowClick={onRowClick}
      />

      {/* Mobile view */}
      <MetricCategoryMobileTable
        categories={categories}
        rowKey={(cat) => cat.id}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        onEdit={onEdit}
        onDelete={onDelete}
        onRowClick={onRowClick}
      />
    </>
  );
};
MetricCategoryTableBase.displayName = "MetricCategoryTable";

const MetricCategoryTable = memo(MetricCategoryTableBase);
MetricCategoryTable.displayName = "MetricCategoryTable";
export default MetricCategoryTable;
