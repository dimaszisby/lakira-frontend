import { toCategoryUI } from "@/features/metric-categories/presenters/toCategoryUI";
import type { MetricPreviewResponseDTO } from "@/features/metrics/metric.dto";
import { SERVER_SORTABLE_COLUMNS } from "@/features/metrics/sort";
import CategoryChip from "@/src/features/metric-categories/components/CategoryChip";
import type { SortChipsColumns } from "@/ui/SortChipGroup";
import type { TableColumn } from "@/ui/Table";

// Shared types for both desktop and mobile tables
// TODO: Create a generic for shared between Metric, MetricCategory, and Logs
export interface MetricTableProps {
  metrics: MetricPreviewResponseDTO[];
  sortBy: string;
  sortOrder: "ASC" | "DESC" | null;
  onSort: (column: string) => void;
  onEdit?: (metric: MetricPreviewResponseDTO) => void;
  onDelete?: (metric: MetricPreviewResponseDTO) => void;
  onRowClick?: (metric: MetricPreviewResponseDTO) => void;
  rowKey?: (item: MetricPreviewResponseDTO) => string; // Mobile, Optional for SwipeableCard
  className?: string;
}

export const mobileColumns: SortChipsColumns<MetricPreviewResponseDTO>[] = [
  {
    key: "category",
    label: "Category",
    sortable: false,
  },
  {
    key: "name",
    label: "Name",
    sortable: false,
  },
  {
    key: "description",
    label: "Description",
    sortable: true,
  },
  {
    key: "defaultUnit",
    label: "Unit",
    sortable: true,
  },
  {
    key: "isPublic",
    label: "Visibility",
    sortable: true,
  },
  {
    key: "logCount",
    label: "Logs",
    sortable: true,
  },
];

const canSort = new Set<string>(SERVER_SORTABLE_COLUMNS);
export const desktopColumns: TableColumn<MetricPreviewResponseDTO>[] = [
  {
    key: "category",
    label: "CATEGORY",
    align: "center",
    width: "w-[50px]",
    responsiveWidth: { md: "w-[60px]" }, // Slightly wider on medium+
    sortable: true,
    renderCell: (row /* , value */) => {
      const category = toCategoryUI(row.category);
      return <CategoryChip category={category} />;
    },
  },
  {
    key: "name",
    label: "NAME",
    align: "center",
    width: "w-[60px]",
    responsiveWidth: { md: "w-[80px]" },
    sortable: canSort.has("name"),
  },
  {
    key: "description",
    label: "DESCRIPTION",
    align: "left",
    sortable: false,
    width: "w-[140px]",
    responsiveWidth: { md: "w-1/3" },
  },
  {
    key: "defaultUnit",
    label: "UNIT",
    align: "center",
    width: "w-[70px]",
    responsiveWidth: { md: "w-[100px]" },
    sortable: canSort.has("defaultUnit"),
  },
  {
    key: "isPublic",
    label: "VISIBILITY",
    align: "center",
    width: "w-[70px]",
    responsiveWidth: { md: "w-[100px]" },
    sortable: canSort.has("isPublic"),
  },
  {
    key: "logCount",
    label: "Logs",
    align: "center",
    width: "w-[70px]",
    responsiveWidth: { md: "w-[100px]" },
    sortable: canSort.has("logCount"),
  },
];
