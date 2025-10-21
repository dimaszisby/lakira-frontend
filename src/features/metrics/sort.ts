import type { MetricPreviewResponseDTO } from "@/src/features/metrics/metric.dto";
import type { CursorPage, SortParam } from "@/src/types/generics/cursor/CursorPage";

// * =================== OFFSET - Deprecated (Currently Migrating) ===================

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

export const DEFAULT_METRIC_SORT: SortState<ServerSortBy> = {
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
export function sortFromSearchParams(
  sp: URLSearchParams,
  fallback: SortState<ServerSortBy> = DEFAULT_METRIC_SORT,
): SortState<ServerSortBy> {
  const sb = sp.get("sortBy");
  const so = sp.get("sortOrder");
  const sortBy = isServerSortableKey(sb) ? sb : fallback.sortBy;
  const sortOrder: SortOrder = so === "ASC" || so === "DESC" ? so : fallback.sortOrder;
  return { sortBy, sortOrder };
}

// * =================== CURSOR ===================

export type MetricSortParamViaCursor =
  | "createdAt"
  | "-createdAt"
  | "updatedAt"
  | "-updatedAt"
  | "name"
  | "-name"
  | "logCount"
  | "-logCount";

/** Only the keys MetricCategory can sort by */
export type MetricSortableKeyViaCursor = "createdAt" | "updatedAt" | "name" | "logCount";

/** Optional: strong typing for your filter block */
export type MetricFilterViaCursor = {
  name?: string;
  categoryId?: string;
};

export type MetricSortViaCursor = SortParam<MetricSortParamViaCursor>;
export type MetricCursorPage = CursorPage<
  MetricPreviewResponseDTO,
  MetricSortableKeyViaCursor,
  MetricFilterViaCursor
>;

// TODO: Refactor
export const parseSort = (s: MetricSortParamViaCursor) => {
  const dir = s.startsWith("-") ? "DESC" : "ASC";
  const field = s.startsWith("-") ? s.slice(1) : s;
  return { field, dir } as { field: string; dir: "ASC" | "DESC" };
};
// TODO: Refactor
export const nextSortForColumn = (
  current: MetricSortParamViaCursor,
  column: MetricSortableKeyViaCursor,
): MetricSortParamViaCursor => {
  const { field, dir } = parseSort(current);
  if (field === column) {
    return (dir === "ASC" ? `-${column}` : column) as MetricSortParamViaCursor; // toggle direction
  }
  if (column === "name") return "name"; // default direction per field: dates & numbers -> DESC, strings -> ASC
  return `-${column}` as MetricSortParamViaCursor;
};
