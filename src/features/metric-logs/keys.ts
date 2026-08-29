import type { MetricLogFilter, MetricLogSortParam, MetricsLogsListParams } from "./sort";

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
  sort: MetricLogSortParam;
  q?: string;
  filter?: MetricLogFilter;
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
/**
 * Cache keys for metric logs.
 *
 * Every key carries the organization id at index 1, immediately after the
 * resource root. Without it, a user in two organizations would be served one
 * org's cached payload while acting as the other — the defect `lakira-backend`
 * shipped and patched as findings N1/N2.
 *
 * Index 1 rather than 0 keeps `key[0]` naming the resource, which the
 * prefix-matched invalidations in `cache.ts` depend on.
 */
export const metricLogsKeys = {
  all: (organizationId: string) => ["logs", organizationId] as const,

  // ----- Offset lists (legacy) -----
  lists: (organizationId: string) => [...metricLogsKeys.all(organizationId), "list"] as const,
  list: (organizationId: string, params: MetricsLogsListParams) =>
    [...metricLogsKeys.lists(organizationId), normalizeList(params)] as const,

  // ----- Cursor lists (current) -----
  cursor: {
    root: (organizationId: string) => [...metricLogsKeys.all(organizationId), "cursor"] as const,
    pages: (
      organizationId: string,
      p: {
        limit: number;
        sort: MetricLogSortParam;
        q?: string;
        filter?: MetricLogFilter;
        includeTotal?: boolean;
        page: number;
      },
    ) => [...metricLogsKeys.cursor.root(organizationId), "pages", normalizeCursor(p)] as const,
    infinite: (
      organizationId: string,
      p: {
        limit: number;
        sort: MetricLogSortParam;
        q?: string;
        filter?: MetricLogFilter;
        after?: string;
      },
    ) => [...metricLogsKeys.cursor.root(organizationId), "infinite", normalizeCursor(p)] as const,
  },

  // ----- Details -----
  details: (organizationId: string) => [...metricLogsKeys.all(organizationId), "detail"] as const,
  /** fully-qualified detail key (variant-specific) */
  detail: (organizationId: string, logId: string) =>
    [...metricLogsKeys.details(organizationId), logId] as const,
  /** prefix for invalidating all variants of one metricId */
  detailByIdRoot: (organizationId: string, logId: string) =>
    [...metricLogsKeys.details(organizationId), logId] as const,
};
