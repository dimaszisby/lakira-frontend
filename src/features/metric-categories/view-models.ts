import type { CursorPageVM } from "@/src/generics/cursor/view-model";
import type { MetricCategoryResponseDTO } from "@/types/dtos/metric-category.dto";

import type { MetricCategoryListSearchParams } from "./listSearchParams";
import type { MetricCategoryFilter, MetricCategorySortableKey } from "./sort";

export type MetricCategoryVM = {
  id: string;

  // Base
  name: string;
  color: string;
  icon: string;

  // Relations
  metricCount?: number;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  returnParams?: MetricCategoryListSearchParams | null;
};

// The UI shape is strictly non-nullable for rendering.
export type MetricCategoryUI = Readonly<{
  id?: string;
  name: string;
  color: `#${string}`; // hex-like strings
  icon: string;
}>;

export type MetricCategoryCursorPageVM = CursorPageVM<
  MetricCategoryResponseDTO,
  MetricCategoryVM,
  MetricCategorySortableKey,
  MetricCategoryFilter
>;
