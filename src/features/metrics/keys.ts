import type { MetricFilterViaCursor, MetricSortViaCursor } from "./sort";
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
  sort: MetricSortViaCursor;
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
export const metricsKeys = {
  all: ["metrics"] as const,

  // Offset lists (legacy)
  lists: () => [...metricsKeys.all, "list"] as const,
  list: (params: MetricsListParams) => [...metricsKeys.lists(), normalizeList(params)] as const,

  // Cursor lists (current)
  cursor: {
    root: () => [...metricsKeys.all, "cursor"] as const,
    pages: (p: {
      limit: number;
      sort: MetricSortViaCursor;
      q?: string;
      filter?: MetricFilterViaCursor;
      includeTotal?: boolean;
      page: number;
    }) => [...metricsKeys.cursor.root(), "pages", normalizeCursor(p)] as const,
    infinite: (p: {
      limit: number;
      sort: MetricSortViaCursor;
      q?: string;
      filter?: MetricFilterViaCursor;
    }) =>
      [
        ...metricsKeys.cursor.root(),
        "infinite",
        normalizeCursor({ ...p, after: undefined }),
      ] as const,
  },

  // Details
  details: () => [...metricsKeys.all, "detail"] as const,
  /** fully-qualified detail key (variant-specific) */
  detail: (metricId: string, includes: IncludeKey[] = [], logsLimit?: number) =>
    [
      ...metricsKeys.details(),
      metricId,
      { includes: normalizeIncludes(includes), logsLimit: logsLimit ?? 20 },
    ] as const,
  /** prefix for invalidating all variants of one metricId */
  detailByIdRoot: (metricId: string) => [...metricsKeys.details(), metricId] as const,
};
