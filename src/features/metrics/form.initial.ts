import type {
  MetricPreviewResponseDTO,
  MetricResponseDTO,
  UserMetricDetailResponseDTO,
} from "./metric.dto";

export type MetricFormInitial = {
  id?: string;
  name: string;
  description: string | null;
  defaultUnit: string;
  isPublic: boolean;
  originalMetricId?: string | null;
  categoryId?: string | null;

  // optional hint for the CategorySelect label/icon/color
  categoryHint?: {
    label: string;
    color: string;
    icon: string;
    metricCount: number;
  };
};

export function fromPreview(m: MetricPreviewResponseDTO): MetricFormInitial {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    defaultUnit: m.defaultUnit,
    isPublic: m.isPublic,
    categoryId: m.category?.id ?? null,
    originalMetricId: null,
    categoryHint: m.category
      ? {
          label: m.category.name,
          color: m.category.color,
          icon: m.category.icon,
          metricCount: m.logCount ?? 0, // preview has logCount; if you have per-category count elsewhere, use that
        }
      : undefined,
  };
}

export function fromDetail(m: UserMetricDetailResponseDTO): MetricFormInitial {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    defaultUnit: m.defaultUnit,
    isPublic: m.isPublic,
    categoryId: m.categoryId,
    originalMetricId: m.originalMetricId,
    categoryHint: m.category
      ? {
          label: m.category.name,
          color: m.category.color,
          icon: m.category.icon,
          metricCount: m.category.metricCount ?? 0,
        }
      : undefined,
  };
}

export function fromResponse(m: MetricResponseDTO): MetricFormInitial {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    defaultUnit: m.defaultUnit,
    isPublic: m.isPublic,
    categoryId: m.categoryId,
    originalMetricId: m.originalMetricId,
    // no hint available in this DTO
  };
}
