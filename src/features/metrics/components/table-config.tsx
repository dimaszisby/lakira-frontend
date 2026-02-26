import { Eye, EyeSlash } from "phosphor-react";

import CategoryChip from "@/features/metric-categories/components/CategoryChip";
import { toCategoryUI } from "@/features/metric-categories/presenters/toCategoryUI";
import { METRIC_SORT_KEYS } from "@/features/metrics/sort";
import type { MetricPreviewVM } from "@/features/metrics/view-models";
import IconLabel from "@/ui/IconLabel";
import type { SortChipsColumns } from "@/ui/SortChipGroup";
import type { TableColumn } from "@/ui/Table";

// Shared types for both desktop and mobile tables
// TODO: Create a generic for shared between Metric, MetricCategory, and Logs
export interface MetricTableProps {
  metrics: MetricPreviewVM[];
  sortBy: keyof MetricPreviewVM;
  sortOrder: "ASC" | "DESC" | null;
  onSort: (column: keyof MetricPreviewVM) => void;
  onEdit?: (metric: MetricPreviewVM) => void;
  onDelete?: (metric: MetricPreviewVM) => void;
  onRowClick?: (metric: MetricPreviewVM) => void;
  onRowHover?: (metric: MetricPreviewVM) => void;
  rowKey?: (item: MetricPreviewVM) => string; // Mobile, Optional for SwipeableCard
  className?: string;
  variant?: "desktop" | "mobile" | "both";
}

export const mobileColumns: SortChipsColumns<MetricPreviewVM>[] = [
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

const canSort = new Set<string>(METRIC_SORT_KEYS);
export const desktopColumns: TableColumn<MetricPreviewVM>[] = [
  {
    key: "category",
    label: "CATEGORY",
    align: "center",
    width: "w-[50px]",
    responsiveWidth: { md: "w-[60px]" }, // Slightly wider on medium+
    sortable: false,
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
    renderCell: (row /* , value */) => {
      return row.description ? (
        <span>{row.description}</span>
      ) : (
        <span className="font-light text-ink-tertiary">No Description</span>
      );
    },
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
    renderCell: (row /* , value */) => {
      return (
        <IconLabel
          icon={row.isPublic ? Eye : EyeSlash}
          label={row.isPublic ? "Public" : "Private"}
          tone={row.isPublic ? "success" : "muted"}
          size="sm"
          iconClassName="mr-1"
        />
      );
    },
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
