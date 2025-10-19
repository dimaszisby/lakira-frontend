import React from "react";

import type { MetricLogVM } from "@/src/features/metric-logs/view-models";

import LogDesktopTable from "./LogDesktopTable";
import LogMobileTable from "./LogMobileTable";
import type { LogTableProps } from "./table-config";

const LogTable = React.memo(
  ({ logs, sortBy, sortOrder, onSort, onEdit, onDelete, onRowClick }: LogTableProps) => {
    return (
      <>
        {/* Desktop view */}
        <LogDesktopTable
          logs={logs}
          sortBy={sortBy as keyof MetricLogVM}
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
          sortBy={sortBy as keyof MetricLogVM}
          sortOrder={sortOrder}
          onSort={onSort}
          onEdit={onEdit}
          onDelete={onDelete}
          className="block sm:hidden"
        />
      </>
    );
  },
);

LogTable.displayName = "LogTable";

export default LogTable;
