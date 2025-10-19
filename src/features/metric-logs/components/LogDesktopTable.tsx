import React, { memo } from "react";

import type { MetricLogVM } from "@/src/features/metric-logs/view-models";
import type { TableColumn } from "@/ui/Table";
import { TableBase } from "@/ui/Table";

import type { LogTableProps } from "../../../components/pages/logs/types";

const columns: TableColumn<MetricLogVM>[] = [
  {
    key: "loggedAt",
    label: "LOGGED AT",
    align: "center",
    sortable: true,
    renderCell: (log) => new Date(log.loggedAt).toLocaleString(),
  },
  {
    key: "logValue",
    label: "LOG VALUE",
    align: "center",
    sortable: true,
    renderCell: (log) => log.logValue,
  },
];

export const LogDesktopTableBase = ({
  logs,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onRowClick,
}: LogTableProps) => {
  return (
    <TableBase<MetricLogVM>
      data={logs}
      columns={columns}
      sortBy={sortBy as keyof MetricLogVM}
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
LogDesktopTableBase.displayName = "LogDesktopTable";

const LogDesktopTable = memo(LogDesktopTableBase);
LogDesktopTable.displayName = "LogDesktopTable";
export default LogDesktopTable;
