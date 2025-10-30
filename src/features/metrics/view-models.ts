import type { MetricCategoryVM } from "@/features/metric-categories/view-models";
import type { ISODateTimeString } from "@/types/aliases";
import type { CursorPageVM } from "@/types/generics/cursor/CursorPage.view-model";

import type { MetricSettingsExtendedVM } from "../metric-settings/view-models";
import type { MetricPreviewResponseDTO } from "./metric.dto";
import type { MetricFilterViaCursor, MetricSortableKeyViaCursor } from "./sort";

// * Composite
export type MetricDetailCompositeVM = {
  header: MetricHeaderVM;
  settings: MetricSettingsExtendedVM | null;
};

// * Base
// Metric Details Header Base
export type MetricHeaderVM = {
  id: string;

  // Base
  name: string;
  defaultUnit: string;
  description: string | null;
  isPublic: boolean;

  // Relations
  category: MetricCategoryVM | null;
  originalMetricId?: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
};

// Preview Base
export type MetricPreviewVM = {
  id: string;

  // Base
  name: string;
  defaultUnit: string;
  description: string | null;
  isPublic: boolean;

  // Relations
  originalMetricId?: string | null; // currently not displayed in the preview
  category: MetricCategoryVM | null;
  goalType?: string | null; // currently not displayed in the preview
  logCount: number;

  // Timestamps
  createdAt?: ISODateTimeString; // currently not displayed in the preview
  updatedAt?: ISODateTimeString; // currently not displayed in the preview
};

// * List
// Preview Cursor Page
export type MetricCursorPageVM = CursorPageVM<
  MetricPreviewResponseDTO,
  MetricPreviewVM,
  MetricSortableKeyViaCursor,
  MetricFilterViaCursor
>;
