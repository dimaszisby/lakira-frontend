import type { CursorPage, SortParam } from "@/src/generics/cursor/types";
import type { SortOrder } from "@/src/generics/sort";
import { createCursorSort } from "@/src/lib/sort/cursorSort";
import type { MetricLogResponseDTO } from "@/src/types/dtos/metric-log.dto";

// MetricExtended Opts
export type ListOptions = { enabled?: boolean; staleTime?: number };

// * Offset (Deprecated)
export type MetricsLogsListParams = {
  page?: number;
  limit?: number;
  sortBy?: MetricLogSortParam;
  sortOrder?: SortOrder;
  // optional filters you actually support on BE:
  q?: string;
  logValue?: number;
  metricId?: string;
  // future: add more filters here as needed
};

// * Cursor
export const METRIC_LOG_SORT_KEYS = ["createdAt", "updatedAt", "logValue", "loggedAt"] as const;

export type MetricLogSortableKey = (typeof METRIC_LOG_SORT_KEYS)[number];
export type MetricLogSortParam = SortParam<MetricLogSortableKey>;

// Filter
export type MetricLogFilter = { name?: string; metricId?: string };

// Cursor Page Response DTO
export type MetricLogCursorPageResponse = CursorPage<
  MetricLogResponseDTO,
  MetricLogSortableKey,
  MetricLogFilter
>;

// Domain-configured sort instance
export const metricLogSort = createCursorSort({
  keys: METRIC_LOG_SORT_KEYS,
  defaultDesc: ["createdAt", "updatedAt", "logValue", "loggedAt"] as const,
  defaultSort: "-createdAt" as const,
});

export const {
  DEFAULT_SORT: DEFAULT_METRIC_LOG_SORT,
  parseSort,
  nextSortForColumn,
  sortFromSearchParams,
  isKey: isSortableColumn,
} = metricLogSort;
