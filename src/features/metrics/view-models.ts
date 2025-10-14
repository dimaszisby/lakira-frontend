import type { ISODateString } from "@/src/types/aliases";

import type { MetricCategoryVM } from "../metric-categories/view-models";
import type { MetricSettingsExtendedVM } from "../metric-settings/view-models";

export type MetricDetailCompositeVM = {
  header: MetricHeaderVM;
  settings: MetricSettingsExtendedVM;
};

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
