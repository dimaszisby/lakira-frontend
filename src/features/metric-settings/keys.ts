import type { SortOrder } from "@/generics/sort";

import type { MetricSettingsFilter, MetricSettingsSortParam } from "./sort";

// Define parameters for offset-based list queries
export type MetricSettingsListParams = {
  page?: number;
  limit?: number;
  sortBy?: MetricSettingsSortParam;
  sortOrder?: SortOrder;
  metricId?: string;
};

// helpers to keep keys stable
const normalizeList = (p: MetricSettingsListParams) => ({
  page: p.page ?? 1,
  limit: p.limit ?? 20,
  sortBy: p.sortBy ?? "createdAt",
  sortOrder: p.sortOrder ?? "DESC",
  metricId: p.metricId ?? undefined,
});

const normalizeCursor = (p: {
  limit: number;
  sort: MetricSettingsSortParam;
  filter?: MetricSettingsFilter;
  includeTotal?: boolean;
  page?: number; // for paged cursor hook
  after?: string; // for infinite hook pageParam
}) => ({
  limit: p.limit ?? 20,
  sort: p.sort ?? "-createdAt",
  filter: {
    metricId: p.filter?.metricId?.trim() || undefined,
  },
  includeTotal: Boolean(p.includeTotal),
  page: p.page ?? undefined,
  after: p.after ?? undefined,
});

// Cache invalidations based on => List or Details
/**
 * Cache keys for metric settings.
 *
 * Every key carries the organization id at index 1, immediately after the
 * resource root. Without it, a user in two organizations would be served one
 * org's cached payload while acting as the other — the defect `lakira-backend`
 * shipped and patched as findings N1/N2.
 *
 * Index 1 rather than 0 keeps `key[0]` naming the resource, which the
 * prefix-matched invalidations in `cache.ts` depend on.
 */
export const metricSettingsKeys = {
  all: (organizationId: string) => ["metric-settings", organizationId] as const,

  // ----- Offset lists (legacy) -----
  lists: (organizationId: string) => [...metricSettingsKeys.all(organizationId), "list"] as const,
  list: (organizationId: string, params: MetricSettingsListParams) =>
    [...metricSettingsKeys.lists(organizationId), normalizeList(params)] as const,

  // ----- Cursor lists (current) -----
  cursor: {
    root: (organizationId: string) =>
      [...metricSettingsKeys.all(organizationId), "cursor"] as const,
    pages: (
      organizationId: string,
      p: {
        limit: number;
        sort: MetricSettingsSortParam;
        filter?: MetricSettingsFilter;
        includeTotal?: boolean;
        page: number;
      },
    ) => [...metricSettingsKeys.cursor.root(organizationId), "pages", normalizeCursor(p)] as const,
    infinite: (
      organizationId: string,
      p: {
        limit: number;
        sort: MetricSettingsSortParam;
        filter?: MetricSettingsFilter;
        after?: string;
      },
    ) =>
      [...metricSettingsKeys.cursor.root(organizationId), "infinite", normalizeCursor(p)] as const,
  },

  // ----- Details -----
  details: (organizationId: string) =>
    [...metricSettingsKeys.all(organizationId), "detail"] as const,
  /** fully-qualified detail key (variant-specific) */
  detail: (organizationId: string, metricId: string) =>
    [...metricSettingsKeys.details(organizationId), metricId] as const,
  /** prefix for invalidating all variants of one metricId */
  detailByIdRoot: (organizationId: string, metricId: string) =>
    [...metricSettingsKeys.details(organizationId), metricId] as const,
};
