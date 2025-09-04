import React from "react";
import { Table, TableColumn } from "@/components/ui/Table";
import { MetricLogResponseDTO } from "@/src/types/dtos/metric-log.dto";
import { LogTableProps } from "./types";

const columns: TableColumn<MetricLogResponseDTO>[] = [
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

const LogDesktopTable = React.memo(
  ({
    logs,
    sortBy,
    sortOrder,
    onSort,
    onEdit,
    onDelete,
    onRowClick,
  }: LogTableProps) => {
    return (
      <Table<MetricLogResponseDTO>
        data={logs}
        columns={columns}
        sortBy={sortBy as keyof MetricLogResponseDTO}
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
  }
);

LogDesktopTable.displayName = "LogDesktopTable";

export default LogDesktopTable;
