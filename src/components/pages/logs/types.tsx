import { SortChipsColumns } from "@/components/ui/SortChipGroup";
import { MetricLogResponseDTO } from "@/src/types/dtos/metric-log.dto";

// Shared types for both desktop and mobile tables
export interface LogTableProps {
  logs: MetricLogResponseDTO[];
  sortBy: string;
  sortOrder: "ASC" | "DESC" | null;
  onSort: (column: string) => void;
  onEdit?: (category: MetricLogResponseDTO) => void;
  onDelete?: (category: MetricLogResponseDTO) => void;
  onRowClick?: (metric: MetricLogResponseDTO) => void;
  rowKey?: (item: MetricLogResponseDTO) => string; // Mobile, Optional for SwipeableCard
  className?: string;
}

export const mobileColumns: SortChipsColumns<MetricLogResponseDTO>[] = [
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
