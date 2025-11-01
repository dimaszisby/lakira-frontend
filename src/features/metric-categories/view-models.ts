import type { MetricCategoryResponseDTO } from "@/types/dtos/metric-category.dto";

import type { CursorPageVM } from "../metric-logs/view-models";
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
