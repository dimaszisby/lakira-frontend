import type { MetricLogResponseDTO } from "@/src/types/dtos/metric-log.dto";
import type { CursorPage, SortParam } from "@/src/types/generics/CursorPage";

// MetricExtended Opts
export type ListOptions = { enabled?: boolean; staleTime?: number };

export type MetricsLogsListParams = {
  page?: number;
  limit?: number;
  sortBy?: MetricLogSortableKeyViaCursor;
  sortOrder?: SortOrder;
  // optional filters you actually support on BE:
  q?: string;
  logValue?: number;
  metricId?: string;
  // future: add more filters here as needed
};

// * Cursor
export type SortOrder = "ASC" | "DESC";
export type MetricLogSortParamViaCursor =
  | "createdAt"
  | "-createdAt"
  | "updatedAt"
  | "-updatedAt"
  | "logValue"
  | "-logValue"
  | "loggedAt"
  | "-loggedAt";

/** Only the keys MetricCategory can sort by */
export type MetricLogSortableKeyViaCursor = "createdAt" | "updatedAt" | "logValue" | "loggedAt";

/** Optional: strong typing for your filter block */
export type MetricLogFilterViaCursor = {
  name?: string;
  metricId?: string;
};

export type MetricLogSortViaCursor = SortParam<MetricLogSortParamViaCursor>;
export type MetricLogCursorPageResponse = CursorPage<
  MetricLogResponseDTO,
  MetricLogSortableKeyViaCursor,
  MetricLogFilterViaCursor
>;

// TODO: Refactor
export const parseSort = (s: MetricLogSortParamViaCursor) => {
  const dir = s.startsWith("-") ? "DESC" : "ASC";
  const field = s.startsWith("-") ? s.slice(1) : s;
  return { field, dir } as { field: string; dir: "ASC" | "DESC" };
};

// TODO: Refactor
export const nextSortForColumn = (
  current: MetricLogSortParamViaCursor,
  column: MetricLogSortableKeyViaCursor,
): MetricLogSortParamViaCursor => {
  const { field, dir } = parseSort(current);
  if (field === column) {
    return (dir === "ASC" ? `-${column}` : column) as MetricLogSortParamViaCursor; // toggle direction
  }
  if (column === "logValue") return "logValue"; // default direction per field: dates & numbers -> DESC, strings -> ASC
  return `-${column}` as MetricLogSortParamViaCursor;
};
