import type { MetricCategoryResponseDTO } from "@/types/dtos/metric-category.dto";

import type { MetricCategoryVM } from "./view-models";

export const toVM = (d: MetricCategoryResponseDTO): MetricCategoryVM => ({
  id: d.id,
  name: d.name,
  color: d.color,
  icon: d.icon,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
  deletedAt: d.deletedAt ?? null,
  metricCount: d.metricCount ?? 0,
});
