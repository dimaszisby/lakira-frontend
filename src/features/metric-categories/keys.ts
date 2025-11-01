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
export const metricCategoriesKeys = {
  all: ["categories"] as const,

  // ----- Cursor lists (current) -----
  cursor: {
    root: () => [...metricCategoriesKeys.all, "cursor"] as const,
    pages: (p: {
      limit: number;
      sort: MetricCategorySortParam;
      q?: string;
      filter?: MetricCategoryFilter;
      includeTotal?: boolean;
      page: number;
    }) => [...metricCategoriesKeys.cursor.root(), "pages", normalizeCursor(p)] as const,
    infinite: (p: {
      limit: number;
      sort: MetricCategorySortParam;
      q?: string;
      filter?: MetricCategoryFilter;
      after?: string;
    }) => [...metricCategoriesKeys.cursor.root(), "infinite", normalizeCursor(p)] as const,
  },

  // ----- Details -----
  details: () => [...metricCategoriesKeys.all, "detail"] as const,
  /** fully-qualified detail key (variant-specific) */
  detail: (categoryId: string) => [...metricCategoriesKeys.details(), categoryId] as const,
  /** prefix for invalidating all variants of one metricId */
  detailByIdRoot: (categoryId: string) => [...metricCategoriesKeys.details(), categoryId] as const,
};
