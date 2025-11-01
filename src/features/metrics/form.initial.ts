import type { MetricCategoryVM } from "../metric-categories/view-models";
import type { MetricHeaderVM, MetricPreviewVM } from "./view-models";

// Base data types used in metric form
export type MetricFormInitial = {
  id?: string;
  name: string;
  defaultUnit: string;
  description: string | null;
  isPublic: boolean;

  // Relations
  originalMetricId?: string | null;
  category?: Pick<MetricCategoryVM, "id" | "name" | "color" | "icon" | "metricCount">;
};

// TODO: unify these conversion functions with the ones in /features/metrics/utils.ts
export function fromPreview(m: MetricPreviewVM): MetricFormInitial {
  return {
    id: m.id,
    name: m.name,
    defaultUnit: m.defaultUnit,
    description: m.description,
    isPublic: m.isPublic,

    // Relations
    originalMetricId: null,
    category: m.category ? normalizeCategory(m.category) : undefined,
  };
}

export function fromDetail(m: MetricHeaderVM): MetricFormInitial {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    defaultUnit: m.defaultUnit,
    isPublic: m.isPublic,

    // Relations
    originalMetricId: m.originalMetricId,
    category: m.category ? normalizeCategory(m.category) : undefined,
  };
}

function normalizeCategory(c: MetricCategoryVM): MetricCategoryVM {
  return {
    id: c.id ?? undefined,
    name: c.name,
    color: c.color,
    icon: c.icon,
    metricCount: c.metricCount ?? undefined,
  };
}
