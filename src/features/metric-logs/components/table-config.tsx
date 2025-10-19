import type { SortChipsColumns } from "@/components/ui/SortChipGroup";
import type { MetricLogVM } from "@/src/features/metric-logs/view-models";

// Shared types for both desktop and mobile tables
export interface LogTableProps {
  logs: MetricLogVM[];
  sortBy: string;
  sortOrder: "ASC" | "DESC" | null;
  onSort: (column: string) => void;
  onEdit?: (category: MetricLogVM) => void;
  onDelete?: (category: MetricLogVM) => void;
  onRowClick?: (metric: MetricLogVM) => void;
  rowKey?: (item: MetricLogVM) => string; // Mobile, Optional for SwipeableCard
  className?: string;
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
