import { memo } from "react";

import LogDesktopTable from "./LogDesktopTable";
import LogMobileTable from "./LogMobileTable";
import type { LogTableProps } from "./table-config";

export const LogTableBase = ({
  logs,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onRowClick,
  mobileClassName,
}: LogTableProps) => {
  return (
    <>
      {/* Desktop view */}
      <LogDesktopTable
        logs={logs}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        onEdit={onEdit}
        onDelete={onDelete}
        onRowClick={onRowClick}
      />

      {/* Mobile view */}
      <LogMobileTable
        logs={logs}
        rowKey={(log) => log.id}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        onEdit={onEdit}
        onDelete={onDelete}
        onRowClick={onRowClick}
        mobileClassName={mobileClassName}
      />
    </>
  );
};
LogTableBase.displayName = "LogTable";

const LogTable = memo(LogTableBase);
LogTable.displayName = "LogTable";

export default LogTable;
