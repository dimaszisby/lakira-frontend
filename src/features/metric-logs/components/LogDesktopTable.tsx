import { memo } from "react";

import type { MetricLogVM } from "@/features/metric-logs/view-models";
import type { TableColumn } from "@/ui/Table";
import { TableBase } from "@/ui/Table";

import type { LogTableProps } from "./table-config";

const formatTimestamp = (value?: string) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString();
};

const columns: TableColumn<MetricLogVM>[] = [
  {
    key: "loggedAt",
    label: "LOGGED AT",
    align: "center",
    sortable: true,
    renderCell: (log) => formatTimestamp(log.loggedAt),
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
  className,
}: LogTableProps) => {
  return (
    <TableBase<MetricLogVM>
      data={logs}
      columns={columns}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      rowKey={(cat) => cat.id}
      onEdit={onEdit}
      onDelete={onDelete}
      onRowClick={onRowClick}
      className={className}
      ariaLabel="Metric logs table"
      emptyMessage="No logs available"
      // Optionally: custom row component for editing/deleting per row
      // renderRow={(category) => <MetricCategoryTableRow key={category.id} category={category} />}
    />
  );
};
LogDesktopTableBase.displayName = "LogDesktopTable";

const LogDesktopTable = memo(LogDesktopTableBase);
LogDesktopTable.displayName = "LogDesktopTable";
export default LogDesktopTable;
