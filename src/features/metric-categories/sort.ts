import type { CursorPage, SortParam } from "@/src/generics/cursor/types";
import { createCursorSort } from "@/src/lib/sort/cursorSort";
import type { MetricCategoryResponseDTO } from "@/src/types/dtos/metric-category.dto";

export const METRIC_CATEGORY_SORT_KEYS = ["createdAt", "updatedAt", "name", "metricCount"] as const;

export type MetricCategorySortableKey = (typeof METRIC_CATEGORY_SORT_KEYS)[number];
export type MetricCategorySortParam = SortParam<MetricCategorySortableKey>;

// Filter
export type MetricCategoryFilter = {
  name?: string;
};

// Cursor Page Response DTO
export type MetricCategoryCursorPage = CursorPage<
  MetricCategoryResponseDTO,
  MetricCategorySortableKey,
  MetricCategoryFilter
>;

// Domain-configured sort instance
export const metricCategorySort = createCursorSort({
  keys: METRIC_CATEGORY_SORT_KEYS,
  defaultDesc: ["createdAt", "updatedAt", "metricCount"] as const, // dates & numbers → DESC
  defaultSort: "-createdAt" as const,
});

export const {
  DEFAULT_SORT: DEFAULT_METRIC_CATEGORY_SORT,
  parseSort,
  nextSortForColumn,
  sortFromSearchParams,
  isKey: isSortableColumn,
} = metricCategorySort;
