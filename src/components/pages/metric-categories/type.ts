import type {SortChipsColumns} from "@/components/ui/SortChipGroup";
import type {MetricCategoryResponseDTO} from "@/src/types/dtos/metric-category.dto";

// Shared types for both desktop and mobile tables
export interface CategoryTableProps {
  categories: MetricCategoryResponseDTO[];
  sortBy: string;
  sortOrder: "ASC" | "DESC" | null;
  onSort: (column: string) => void;
  onEdit?: (category: MetricCategoryResponseDTO) => void;
  onDelete?: (category: MetricCategoryResponseDTO) => void;
  onRowClick?: (metric: MetricCategoryResponseDTO) => void;
  rowKey?: (item: MetricCategoryResponseDTO) => string; // Mobile, Optional for SwipeableCard
  className?: string;
}

export const mobileColumns: SortChipsColumns<MetricCategoryResponseDTO>[] = [
  {
    key: "icon",
    label: "Icon",
    sortable: false,
  },
  {
    key: "color",
    label: "Color",
    sortable: false,
  },
  {
    key: "name",
    label: "Name",
    sortable: true,
  },
  {
    key: "metricCount",
    label: "Metrics",
    sortable: true,
  },
  { key: "updatedAt", label: "Updated", sortable: true },
  { key: "createdAt", label: "Created", sortable: true },
];
