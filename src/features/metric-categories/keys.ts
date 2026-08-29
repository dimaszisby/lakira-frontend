import type { MetricCategoryFilter, MetricCategorySortParam } from "./sort";

const normalizeCursor = (p: {
  limit: number;
  sort: MetricCategorySortParam;
  q?: string;
  filter?: MetricCategoryFilter;
  includeTotal?: boolean;
  page?: number; // for paged cursor hook
  after?: string; // for infinite hook pageParam
}) => ({
  limit: p.limit ?? 20,
  sort: p.sort ?? "-createdAt",
  q: p.q?.trim() || undefined,
  filter: {
    name: p.filter?.name?.trim() || undefined,
  },
  includeTotal: Boolean(p.includeTotal),
  page: p.page ?? undefined,
  after: p.after ?? undefined,
});

// * Cache Invalidation
// Cache invalidations based on => List or Details
/**
 * Cache keys for metric categories.
 *
 * Every key carries the organization id at index 1, immediately after the
 * resource root. Without it, a user in two organizations would be served one
 * org's cached payload while acting as the other — the defect `lakira-backend`
 * shipped and patched as findings N1/N2.
 *
 * Index 1 rather than 0 keeps `key[0]` naming the resource, which the
 * prefix-matched invalidations in `cache.ts` depend on.
 */
export const metricCategoriesKeys = {
  all: (organizationId: string) => ["categories", organizationId] as const,

  // ----- Cursor lists (current) -----
  cursor: {
    root: (organizationId: string) =>
      [...metricCategoriesKeys.all(organizationId), "cursor"] as const,
    pages: (
      organizationId: string,
      p: {
        limit: number;
        sort: MetricCategorySortParam;
        q?: string;
        filter?: MetricCategoryFilter;
        includeTotal?: boolean;
        page: number;
      },
    ) =>
      [...metricCategoriesKeys.cursor.root(organizationId), "pages", normalizeCursor(p)] as const,
    infinite: (
      organizationId: string,
      p: {
        limit: number;
        sort: MetricCategorySortParam;
        q?: string;
        filter?: MetricCategoryFilter;
        after?: string;
      },
    ) =>
      [
        ...metricCategoriesKeys.cursor.root(organizationId),
        "infinite",
        normalizeCursor(p),
      ] as const,
  },

  // ----- Details -----
  details: (organizationId: string) =>
    [...metricCategoriesKeys.all(organizationId), "detail"] as const,
  /** fully-qualified detail key (variant-specific) */
  detail: (organizationId: string, categoryId: string) =>
    [...metricCategoriesKeys.details(organizationId), categoryId] as const,
  /** prefix for invalidating all variants of one metricId */
  detailByIdRoot: (organizationId: string, categoryId: string) =>
    [...metricCategoriesKeys.details(organizationId), categoryId] as const,
};
