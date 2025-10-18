import type { SortChipsColumns } from "@/components/ui/SortChipGroup";
import type { MetricCategoryVM } from "@/src/features/metric-categories/view-models";

// Shared types for both desktop and mobile tables
export interface CategoryTableProps {
  categories: MetricCategoryVM[];
  sortBy: string;
  sortOrder: "ASC" | "DESC" | null;
  onSort: (column: string) => void;
  onEdit?: (category: MetricCategoryVM) => void;
  onDelete?: (category: MetricCategoryVM) => void;
  onRowClick?: (metric: MetricCategoryVM) => void;
  rowKey?: (item: MetricCategoryVM) => string; // Mobile, Optional for SwipeableCard
  className?: string;
}

export const mobileColumns: SortChipsColumns<MetricCategoryVM>[] = [
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
