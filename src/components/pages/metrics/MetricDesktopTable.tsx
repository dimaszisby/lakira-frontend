import { memo } from "react";
import { Table } from "@/components/ui/Table";
import { MetricPreviewResponseDTO } from "@/src/features/metrics/metric.dto";
import { desktopColumns, MetricTableProps } from "./table-config";

const MetricDesktopTable = memo(
  ({
    metrics,
    sortBy,
    sortOrder,
    onSort,
    onEdit,
    onDelete,
    onRowClick,
  }: MetricTableProps) => {
    return (
      <Table
        data={metrics}
        columns={desktopColumns}
        sortBy={sortBy as keyof MetricPreviewResponseDTO}
        sortOrder={sortOrder}
        onSort={onSort} // Dev Note: recently changed
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

MetricDesktopTable.displayName = "MetricDesktopTable";

export default MetricDesktopTable;
