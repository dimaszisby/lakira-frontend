import type { MetricCategoryResponseDTO } from "@/src/types/dtos/metric-category.dto";
import type { CursorPage, SortParam } from "@/src/types/generics/CursorPage";

// * Cursor
export type MetricCategorySortParam =
  | "createdAt"
  | "-createdAt"
  | "updatedAt"
  | "-updatedAt"
  | "name"
  | "-name"
  | "metricCount"
  | "-metricCount";

export type MetricCategorySortableKey = "createdAt" | "updatedAt" | "name" | "metricCount";

export type MetricCategoryFilter = {
  name?: string;
};

export type MetricCategorySort = SortParam<MetricCategorySortableKey>;
export type MetricCategoryCursorPage = CursorPage<
  MetricCategoryResponseDTO,
  MetricCategorySortableKey,
  MetricCategoryFilter
>;

// * ========== helpers ==========

export const parseSort = (s: MetricCategorySortParam) => {
  const dir = s.startsWith("-") ? "DESC" : "ASC";
  const field = s.startsWith("-") ? s.slice(1) : s;
  return { field, dir } as { field: string; dir: "ASC" | "DESC" };
};

export const nextSortForColumn = (
  current: MetricCategorySortParam,
  column: MetricCategorySortableKey,
): MetricCategorySortParam => {
  const { field, dir } = parseSort(current);
  if (field === column) {
    return (dir === "ASC" ? `-${column}` : column) as MetricCategorySortParam; // toggle direction
  }
  if (column === "name") return "name"; // default direction per field: dates & numbers -> DESC, strings -> ASC
  return `-${column}` as MetricCategorySortParam;
};
