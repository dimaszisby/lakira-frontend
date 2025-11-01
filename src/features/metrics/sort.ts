import type { MetricPreviewResponseDTO } from "@/features/metrics/metric.dto";
import type { CursorPage, SortParam } from "@/generics/cursor/types";
import { createCursorSort } from "@/lib/sort/cursorSort";

// * =================== OFFSET - Deprecated (Currently Migrating to Cursor) ===================

export const SERVER_SORTABLE_COLUMNS = [
  "createdAt",
  "updatedAt",
  "name",
  "defaultUnit",
  "logCount",
] as const;

export type ServerSortBy = (typeof SERVER_SORTABLE_COLUMNS)[number];
export type SortOrder = "ASC" | "DESC";
export type SortState<K extends string> = { sortBy: K; sortOrder: SortOrder };

export const DEFAULT_METRIC_SORT_OFFSET: SortState<ServerSortBy> = {
  sortBy: "createdAt",
  sortOrder: "DESC",
};

export const METRICS_PAGE_SIZE = 20 as const;

/**
 * Safe guard: accepts unknown and narrows to ServerSortBy
 */
export function isServerSortableKey(key: unknown): key is ServerSortBy {
  return typeof key === "string" && (SERVER_SORTABLE_COLUMNS as readonly string[]).includes(key);
}

export function nextSort<K extends string>(
  current: SortState<K>,
  column: K,
  reset: SortState<K>,
): SortState<K> {
  if (current.sortBy !== column) return { sortBy: column, sortOrder: "ASC" };
  if (current.sortOrder === "ASC") return { sortBy: column, sortOrder: "DESC" };
  return reset;
}

/**
 * Parse sort from URL while clamping to server-allowed values
 * */
export function sortFromSearchParamsOffset(
  sp: URLSearchParams,
  fallback: SortState<ServerSortBy> = DEFAULT_METRIC_SORT_OFFSET,
): SortState<ServerSortBy> {
  const sb = sp.get("sortBy");
  const so = sp.get("sortOrder");
  const sortBy = isServerSortableKey(sb) ? sb : fallback.sortBy;
  const sortOrder: SortOrder = so === "ASC" || so === "DESC" ? so : fallback.sortOrder;
  return { sortBy, sortOrder };
}

// * =================== CURSOR ===================

export const METRIC_SORT_KEYS = ["createdAt", "updatedAt", "name", "logCount"] as const;

export type MetricSortableKeyViaCursor = (typeof METRIC_SORT_KEYS)[number];
export type MetricSortParamViaCursor = SortParam<MetricSortableKeyViaCursor>;

// Filter
export type MetricFilterViaCursor = {
  name?: string;
  categoryId?: string;
};

// Cursor Page Response DTO
export type MetricCursorPage = CursorPage<
  MetricPreviewResponseDTO,
  MetricSortableKeyViaCursor,
  MetricFilterViaCursor
>;

// Domain-configured sort instance
export const metricSort = createCursorSort({
  keys: METRIC_SORT_KEYS,
  defaultDesc: ["createdAt", "updatedAt", "logCount"] as const, // dates & numbers → DESC
  defaultSort: "-createdAt" as const,
});

export const {
  DEFAULT_SORT: DEFAULT_METRIC_SORT,
  parseSort,
  nextSortForColumn,
  sortFromSearchParams,
  isKey: isSortableColumn,
} = metricSort;
