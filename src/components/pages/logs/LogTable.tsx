import React from "react";
import { MetricCategoryResponseDTO } from "@/src/types/dtos/metric-category.dto";
import LogDesktopTable from "./LogDesktopTable";
import LogMobileTable from "./LogMobileTable";
import { LogTableProps } from "./types";

const LogTable = React.memo(
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
      <>
        {/* Desktop view */}
        <LogDesktopTable
          logs={logs}
          sortBy={sortBy as keyof MetricCategoryResponseDTO}
          sortOrder={sortOrder}
          onSort={onSort}
          onEdit={onEdit}
          onDelete={onDelete}
          onRowClick={onRowClick}
          className="space-y-4"
        />

        {/* Mobile view */}
        <LogMobileTable
          logs={logs}
          rowKey={(log) => log.id}
          sortBy={sortBy as keyof MetricCategoryResponseDTO}
          sortOrder={sortOrder}
          onSort={onSort}
          onEdit={onEdit}
          onDelete={onDelete}
          className="block sm:hidden"
        />
      </>
    );
  }
);

LogTable.displayName = "LogTable";

export default LogTable;
