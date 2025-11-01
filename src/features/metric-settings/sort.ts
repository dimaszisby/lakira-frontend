import type { CursorPage, SortParam } from "@/generics/cursor/types";
import { createCursorSort } from "@/lib/sort/cursorSort";
import type { MetricSettingsResponseDTO } from "@/types/dtos/metric-settings.dto";

// MetricExtended Opts
export type ListOptions = { enabled?: boolean; staleTime?: number };

// * Cursor
export const METRIC_SETTINGS_SORT_KEYS = ["createdAt", "updatedAt"] as const;

export type MetricSettingsSortableKey = (typeof METRIC_SETTINGS_SORT_KEYS)[number];
export type MetricSettingsSortParam = SortParam<MetricSettingsSortableKey>;

// Filter
export type MetricSettingsFilter = { metricId?: string };

// Cursor Page Response DTO
export type MetricSettingsCursorPageResponse = CursorPage<
  MetricSettingsResponseDTO,
  MetricSettingsSortableKey,
  MetricSettingsFilter
>;

// Domain-configured sort instance
export const metricSettingsSort = createCursorSort({
  keys: METRIC_SETTINGS_SORT_KEYS,
  defaultDesc: ["createdAt", "updatedAt"] as const,
  defaultSort: "-createdAt" as const,
});

export const {
  DEFAULT_SORT: DEFAULT_METRIC_SETTINGS_SORT,
  parseSort,
  nextSortForColumn,
  sortFromSearchParams,
  isKey: isSortableColumn,
} = metricSettingsSort;
