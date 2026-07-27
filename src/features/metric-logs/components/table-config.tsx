import type { SortChipsColumns } from "@/components/ui/SortChipGroup";
import type { MetricLogVM } from "@/features/metric-logs/view-models";

// Shared types for both desktop and mobile tables
export interface LogTableProps {
  logs: MetricLogVM[];
  sortBy: keyof MetricLogVM;
  sortOrder: "ASC" | "DESC" | null;
  onSort: (column: keyof MetricLogVM) => void;
  onEdit?: (category: MetricLogVM) => void;
  onDelete?: (category: MetricLogVM) => void;
  onRowClick?: (metric: MetricLogVM) => void;
  rowKey?: (item: MetricLogVM) => string; // Mobile, Optional for SwipeableCard
  className?: string;
  mobileClassName?: string;
}

export const mobileColumns: SortChipsColumns<MetricLogVM>[] = [
  {
    key: "loggedAt",
    label: "Logged At",
    sortable: true,
  },
  {
    key: "logValue",
    label: "Log Value",
    sortable: true,
  },
];
