import type { MetricCategoryResponseDTO } from "@/src/types/dtos/metric-category.dto";
import type { CursorPage } from "@/src/types/generics/CursorPage";

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

// Preview Cursor Page
// TODO: Shared cursor page VM
export type CursorPageVM<TIn, TOut, S extends string, F> = Omit<CursorPage<TIn, S, F>, "items"> & {
  items: TOut[];
};

export type MetricCategoryCursorPageVM = CursorPageVM<
  MetricCategoryResponseDTO,
  MetricCategoryVM,
  MetricCategorySortableKey,
  MetricCategoryFilter
>;
