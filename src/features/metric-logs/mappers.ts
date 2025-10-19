import type { MetricLogResponseDTO } from "@/src/types/dtos/metric-log.dto";

import type { MetricLogVM } from "./view-models";

export function toMetricLogVM(dto: MetricLogResponseDTO): MetricLogVM {
  return {
    id: dto.id,

    // Parent Relations
    metricId: dto.metricId,

    // Base
    logValue: dto.logValue,
    loggedAt: dto.loggedAt,
    type: dto.type,

    // Timestamps
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}
