import { MetricLogResponseDTO } from "@/src/types/dtos/metric-log.dto";
import { MetricLogVM } from "./view-models";

export function toMetricLogVM(dto: MetricLogResponseDTO): MetricLogVM {
  return {
    id: dto.id,
    metricId: dto.metricId,
    logValue: dto.logValue,
    loggedAt: dto.loggedAt,
    type: dto.type,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deletedAt: dto.deletedAt
  };
}
