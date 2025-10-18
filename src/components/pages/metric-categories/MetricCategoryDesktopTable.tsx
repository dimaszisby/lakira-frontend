import React, { memo } from "react";

import type { TableColumn } from "@/components/ui/Table";
import { TableBase } from "@/components/ui/Table";
import type { MetricCategoryVM } from "@/src/features/metric-categories/view-models";

import type { CategoryTableProps } from "./type";

const columns: TableColumn<MetricCategoryVM>[] = [
  {
    key: "icon",
    label: "ICON",
    align: "center",
    width: "w-[50px]",
    responsiveWidth: { md: "w-[60px]" }, // Slightly wider on medium+
    renderCell: (cat) => <span>{cat.icon}</span>,
    sortable: false,
  },
  {
    key: "color",
    label: "COLOR",
    align: "center",
    width: "w-[60px]",
    responsiveWidth: { md: "w-[80px]" },
    renderCell: (cat) => (
      <span
        className="inline-block h-5 w-5 rounded-full"
        style={{ backgroundColor: cat.color }}
        aria-label={cat.color}
      />
    ),
    sortable: false,
  },
  {
    key: "name",
    label: "NAME",
    align: "left",
    sortable: true,
    width: "w-[140px]",
    responsiveWidth: { md: "w-1/3" },
  },
  {
    key: "metricCount",
    label: "METRIC #",
    align: "center",
    width: "w-[70px]",
    responsiveWidth: { md: "w-[100px]" },
    sortable: true,
  },
  {
    key: "updatedAt",
    label: "UPDATED",
    align: "left",
    sortable: true,
    width: "w-[160px]",
    renderCell: (cat) => {
      if (!cat.updatedAt) return "N/A";
      return new Date(cat.updatedAt).toLocaleString();
    },
  },
  {
    key: "createdAt",
    label: "CREATED",
    align: "left",
    sortable: true,
    width: "w-[160px]",
    renderCell: (cat) => {
      if (!cat.createdAt) return "N/A";
      return new Date(cat.createdAt).toLocaleString();
    },
  },
];

export const MetricCategoryDesktopTableBase = ({
  categories,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onRowClick,
}: CategoryTableProps) => {
  return (
    <TableBase<MetricCategoryVM>
      data={categories}
      columns={columns}
      sortBy={sortBy as keyof MetricCategoryVM}
      sortOrder={sortOrder}
      onSort={(col) => onSort(String(col))}
      rowKey={(cat) => cat.id}
      onEdit={onEdit}
      onDelete={onDelete}
      onRowClick={onRowClick}
      // Optionally: custom row component for editing/deleting per row
      // renderRow={(category) => <MetricCategoryTableRow key={category.id} category={category} />}
    />
  );
};
MetricCategoryDesktopTableBase.displayName = "MetricCategoryDesktopTable";

const MetricCategoryDesktopTable = memo(MetricCategoryDesktopTableBase);
MetricCategoryDesktopTable.displayName = "MetricCategoryDesktopTable";
export default MetricCategoryDesktopTable;
