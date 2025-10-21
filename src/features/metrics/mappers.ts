import type {
  MetricPreviewResponseDTO,
  UserMetricDetailResponseDTO,
} from "@/features/metrics/metric.dto";

import type { MetricHeaderVM, MetricPreviewVM } from "./view-models";

// MetricHeader section of MetricDetailsPage
export function toMetricHeaderVM(dto: UserMetricDetailResponseDTO): MetricHeaderVM {
  const cat = dto.category;
  return {
    id: dto.id,
    name: dto.name,
    defaultUnit: dto.defaultUnit,
    isPublic: dto.isPublic,
    description: dto.description ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    category: cat ? { id: cat.id, name: cat.name, color: cat.color, icon: cat.icon } : null,
  };
}

export function toMetricPreviewVM(dto: MetricPreviewResponseDTO): MetricPreviewVM {
  const cat = dto.category;
  return {
    // Base
    id: dto.id,
    name: dto.name,
    defaultUnit: dto.defaultUnit,
    description: dto.description ?? null,
    isPublic: dto.isPublic,

    // Relations
    category: cat ? { id: cat.id, name: cat.name, color: cat.color, icon: cat.icon } : null,
    originalMetricId: dto.originalMetricId ?? null,
    goalType: dto.goalType ?? null,
    logCount: dto.logCount,

    // Timestamps
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}
