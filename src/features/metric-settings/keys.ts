// Define sortable fields for metric settings
// export type MetricSettingsSortField = "createdAt" | "updatedAt";

import {
  MetricSettingsFilterViaCursor,
  MetricSettingsSortViaCursor,
  SortOrder,
} from "./sort";

// export type SortOrder = "ASC" | "DESC";

// // Define filter options for cursor-based pagination
// export type MetricSettingsFilterViaCursor = {
//   metricId?: string;
// };

// // Define sort options for cursor-based pagination
// export type MetricSettingsSortViaCursor =
//   | MetricSettingsSortField
//   | `-${MetricSettingsSortField}`;

// Define parameters for offset-based list queries
export type MetricSettingsListParams = {
  page?: number;
  limit?: number;
  sortBy?: MetricSettingsSortViaCursor;
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
  sort: MetricSettingsSortViaCursor;
  filter?: MetricSettingsFilterViaCursor;
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
export const metricSettingsKeys = {
  all: ["metric-settings"] as const,

  // ----- Offset lists (legacy) -----
  lists: () => [...metricSettingsKeys.all, "list"] as const,
  list: (params: MetricSettingsListParams) =>
    [...metricSettingsKeys.lists(), normalizeList(params)] as const,

  // ----- Cursor lists (current) -----
  cursor: {
    root: () => [...metricSettingsKeys.all, "cursor"] as const,
    pages: (p: {
      limit: number;
      sort: MetricSettingsSortViaCursor;
      filter?: MetricSettingsFilterViaCursor;
      includeTotal?: boolean;
      page: number;
    }) =>
      [
        ...metricSettingsKeys.cursor.root(),
        "pages",
        normalizeCursor(p),
      ] as const,
    infinite: (p: {
      limit: number;
      sort: MetricSettingsSortViaCursor;
      filter?: MetricSettingsFilterViaCursor;
      after?: string;
    }) =>
      [
        ...metricSettingsKeys.cursor.root(),
        "infinite",
        normalizeCursor(p),
      ] as const,
  },

  // ----- Details -----
  details: () => [...metricSettingsKeys.all, "detail"] as const,
  /** fully-qualified detail key (variant-specific) */
  detail: (metricId: string) =>
    [...metricSettingsKeys.details(), metricId] as const,
  /** prefix for invalidating all variants of one metricId */
  detailByIdRoot: (metricId: string) =>
    [...metricSettingsKeys.details(), metricId] as const,
};
