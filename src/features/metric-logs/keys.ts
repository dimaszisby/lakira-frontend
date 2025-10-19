import type {
  MetricLogFilterViaCursor,
  MetricLogSortViaCursor,
  MetricsLogsListParams,
} from "./sort";

// helpers to keep keys stable
const normalizeList = (p: MetricsLogsListParams) => ({
  page: p.page ?? 1,
  limit: p.limit ?? 20,
  sortBy: p.sortBy ?? "createdAt",
  sortOrder: p.sortOrder ?? "DESC",
  q: p.q ?? undefined,
  logValue: p.logValue ?? undefined,
  metricId: p.metricId ?? undefined,
});

const normalizeCursor = (p: {
  limit: number;
  sort: MetricLogSortViaCursor;
  q?: string;
  filter?: MetricLogFilterViaCursor;
  includeTotal?: boolean;
  page?: number; // for paged cursor hook
  after?: string; // for infinite hook pageParam
}) => ({
  limit: p.limit ?? 20,
  sort: p.sort ?? "-createdAt",
  q: p.q?.trim() || undefined,
  filter: {
    name: p.filter?.name?.trim() || undefined,
    metricId: p.filter?.metricId?.trim() || undefined,
  },
  includeTotal: Boolean(p.includeTotal),
  page: p.page ?? undefined,
  after: p.after ?? undefined,
});

// Cache invalidations based on => List or Details
export const metricLogsKeys = {
  all: ["logs"] as const,

  // ----- Offset lists (legacy) -----
  lists: () => [...metricLogsKeys.all, "list"] as const,
  list: (params: MetricsLogsListParams) =>
    [...metricLogsKeys.lists(), normalizeList(params)] as const,

  // ----- Cursor lists (current) -----
  cursor: {
    root: () => [...metricLogsKeys.all, "cursor"] as const,
    pages: (p: {
      limit: number;
      sort: MetricLogSortViaCursor;
      q?: string;
      filter?: MetricLogFilterViaCursor;
      includeTotal?: boolean;
      page: number;
    }) => [...metricLogsKeys.cursor.root(), "pages", normalizeCursor(p)] as const,
    infinite: (p: {
      limit: number;
      sort: MetricLogSortViaCursor;
      q?: string;
      filter?: MetricLogFilterViaCursor;
      after?: string;
    }) => [...metricLogsKeys.cursor.root(), "infinite", normalizeCursor(p)] as const,
  },

  // ----- Details -----
  details: () => [...metricLogsKeys.all, "detail"] as const,
  /** fully-qualified detail key (variant-specific) */
  detail: (logId: string) => [...metricLogsKeys.details(), logId] as const,
  /** prefix for invalidating all variants of one metricId */
  detailByIdRoot: (logId: string) => [...metricLogsKeys.details(), logId] as const,
};
