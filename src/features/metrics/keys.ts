import type { MetricFilterViaCursor, MetricSortParamViaCursor } from "./sort";
import type { IncludeKey, MetricsListParams } from "./types";

/**
 * Canonical include normalizer (sorted CSV to match server cache keys)
 */
export function normalizeIncludes(includes: IncludeKey[] = []): string | undefined {
  const allowed: IncludeKey[] = ["settings", "category", "logs"];
  const normalized = includes.filter((s): s is IncludeKey => allowed.includes(s)).sort();
  if (normalized.length === 0) return undefined; // "flat" on server
  return normalized.join(","); // e.g., "category,logs,settings"
}

// helpers to keep keys stable
const normalizeList = (p: MetricsListParams) => ({
  page: p.page ?? 1,
  limit: p.limit ?? 20,
  sortBy: p.sortBy ?? "createdAt",
  sortOrder: p.sortOrder ?? "DESC",
  q: p.q ?? undefined,
  name: p.name ?? undefined,
  categoryId: p.categoryId ?? undefined,
  isPublic: p.isPublic ?? undefined,
});

const normalizeCursor = (p: {
  limit: number;
  sort: MetricSortParamViaCursor;
  q?: string;
  filter?: MetricFilterViaCursor;
  includeTotal?: boolean;
  page?: number; // for paged cursor hook
  after?: string; // for infinite hook pageParam
}) => ({
  limit: p.limit ?? 20,
  sort: p.sort ?? "-createdAt",
  q: p.q?.trim() || undefined,
  filter: {
    name: p.filter?.name?.trim() || undefined,
    categoryId: p.filter?.categoryId?.trim() || undefined,
  },
  includeTotal: Boolean(p.includeTotal),
  page: p.page ?? undefined,
  after: p.after ?? undefined,
});

// Cache invalidations based on => List or Details
/**
 * Cache keys for metrics.
 *
 * Every key carries the organization id at index 1, immediately after the
 * resource root. Without it, a user in two organizations would be served one
 * org's cached payload while acting as the other — the defect `lakira-backend`
 * shipped and patched as findings N1/N2.
 *
 * Index 1 rather than 0 keeps `key[0]` naming the resource, which the
 * prefix-matched invalidations in `cache.ts` depend on.
 */
export const metricsKeys = {
  all: (organizationId: string) => ["metrics", organizationId] as const,

  // Offset lists (legacy)
  lists: (organizationId: string) => [...metricsKeys.all(organizationId), "list"] as const,
  list: (organizationId: string, params: MetricsListParams) =>
    [...metricsKeys.lists(organizationId), normalizeList(params)] as const,

  // Cursor lists (current)
  cursor: {
    root: (organizationId: string) => [...metricsKeys.all(organizationId), "cursor"] as const,
    pages: (
      organizationId: string,
      p: {
        limit: number;
        sort: MetricSortParamViaCursor;
        q?: string;
        filter?: MetricFilterViaCursor;
        includeTotal?: boolean;
        page: number;
      },
    ) => [...metricsKeys.cursor.root(organizationId), "pages", normalizeCursor(p)] as const,
    infinite: (
      organizationId: string,
      p: {
        limit: number;
        sort: MetricSortParamViaCursor;
        q?: string;
        filter?: MetricFilterViaCursor;
      },
    ) =>
      [
        ...metricsKeys.cursor.root(organizationId),
        "infinite",
        normalizeCursor({ ...p, after: undefined }),
      ] as const,
  },

  // Details
  details: (organizationId: string) => [...metricsKeys.all(organizationId), "detail"] as const,
  /** fully-qualified detail key (variant-specific) */
  detail: (
    organizationId: string,
    metricId: string,
    includes: IncludeKey[] = [],
    logsLimit?: number,
  ) =>
    [
      ...metricsKeys.details(organizationId),
      metricId,
      { includes: normalizeIncludes(includes), logsLimit: logsLimit ?? 20 },
    ] as const,
  /** prefix for invalidating all variants of one metricId */
  detailByIdRoot: (organizationId: string, metricId: string) =>
    [...metricsKeys.details(organizationId), metricId] as const,
};
