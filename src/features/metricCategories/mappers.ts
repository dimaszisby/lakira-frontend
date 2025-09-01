import { MetricCategoryResponseDTO } from "@/src/types/dtos/metric-category.dto";
import { MetricCategoryVM } from "./view-models";

export const toVM = (d: MetricCategoryResponseDTO): MetricCategoryVM => ({
  id: d.id, name: d.name, color: d.color, icon: d.icon,
  createdAt: d.createdAt, updatedAt: d.updatedAt, deletedAt: d.deletedAt ?? null
});
