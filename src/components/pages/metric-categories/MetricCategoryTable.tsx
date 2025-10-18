import React, { memo } from "react";

import type { MetricCategoryVM } from "@/src/features/metric-categories/view-models";

import MetricCategoryDesktopTable from "./MetricCategoryDesktopTable";
import MetricCategoryMobileTable from "./MetricCategoryMobileTable";
import type { CategoryTableProps } from "./type";

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
        sortBy={sortBy as keyof MetricCategoryVM}
        sortOrder={sortOrder}
        onSort={onSort}
        onEdit={onEdit}
        onDelete={onDelete}
        onRowClick={onRowClick}
        className="space-y-4"
      />

      {/* Mobile view */}
      <MetricCategoryMobileTable
        categories={categories}
        rowKey={(cat) => cat.id}
        sortBy={sortBy as keyof MetricCategoryVM}
        sortOrder={sortOrder}
        onSort={onSort}
        onEdit={onEdit}
        onDelete={onDelete}
        className="block sm:hidden"
      />
    </>
  );
};
MetricCategoryTableBase.displayName = "MetricCategoryTable";

const MetricCategoryTable = memo(MetricCategoryTableBase);
MetricCategoryTable.displayName = "MetricCategoryTable";
export default MetricCategoryTable;
