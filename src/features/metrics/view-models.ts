import type { ISODateString } from "@/src/types/aliases";
import type { CursorPage } from "@/src/types/generics/CursorPage";

import type { MetricCategoryVM } from "../metric-categories/view-models";
import type { MetricSettingsExtendedVM } from "../metric-settings/view-models";
import type { MetricPreviewResponseDTO } from "./metric.dto";
import type { MetricFilterViaCursor, MetricSortableKeyViaCursor } from "./sort";

export type MetricDetailCompositeVM = {
  header: MetricHeaderVM;
  settings: MetricSettingsExtendedVM;
};

// Metric Details Header
export type MetricHeaderVM = {
  id: string;
  name: string;
  defaultUnit: string;
  isPublic: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;

  category: { id: string; name: string; color: string; icon: string } | null;
  originalMetricId?: string | null;
};

// Preview Base
export type MetricPreviewVM = {
  // Base
  id: string;
  name: string;
  defaultUnit: string;
  description: string | null;
  isPublic: boolean;

  // Relations
  originalMetricId?: string | null; // currently not displayed in the preview, but keep it for future use
  category: MetricCategoryVM | null;
  goalType?: string | null; // currently not displayed in the preview, but keep it for future use
  logCount: number;

  // Timestamps
  createdAt?: ISODateString; // currently not displayed in the preview, but keep it for future use
  updatedAt?: ISODateString; // currently not displayed in the preview, but keep it for future use
};

// Preview Cursor Page
export type CursorPageVM<TIn, TOut, S extends string, F> = Omit<CursorPage<TIn, S, F>, "items"> & {
  items: TOut[];
};
export type MetricCursorPageVM = CursorPageVM<
  MetricPreviewResponseDTO,
  MetricPreviewVM,
  MetricSortableKeyViaCursor,
  MetricFilterViaCursor
>;
