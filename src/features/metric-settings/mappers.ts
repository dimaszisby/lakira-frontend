import type { MetricSettingsResponseDTO } from "@/src/types/dtos/metric-settings.dto";

import { DEFAULT_DISPLAY } from "./constants";
import type { MetricSettingsExtendedVM } from "./view-models";

export function toMetricSettingsVM(dto: MetricSettingsResponseDTO): MetricSettingsExtendedVM {
  return {
    id: dto.id,

    // Relations
    metricId: dto.metricId,

    // Base
    isActive: dto.isActive,

    goalEnabled: dto.goalEnabled,
    goalType: dto.goalType,
    goalValue: dto.goalValue,
    timeFrameEnabled: dto.timeFrameEnabled,
    startDate: dto.startDate,
    deadlineDate: dto.deadlineDate,
    alertEnabled: dto.alertEnabled,
    alertThresholds: dto.alertThresholds,
    isAchieved: dto.isAchieved,

    displayOptions: normalizeDisplayDTO(dto),

    // Timestamps
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function normalizeDisplayDTO(dto: MetricSettingsResponseDTO) {
  return {
    showOnDashboard: dto.displayOptions?.showOnDashboard ?? DEFAULT_DISPLAY.showOnDashboard,
    priority:
      typeof dto.displayOptions?.priority === "number"
        ? dto.displayOptions!.priority
        : DEFAULT_DISPLAY.priority,
    chartType:
      typeof dto.displayOptions?.chartType === "string"
        ? dto.displayOptions!.chartType
        : DEFAULT_DISPLAY.chartType,
    color:
      typeof dto.displayOptions?.color === "string"
        ? dto.displayOptions!.color
        : DEFAULT_DISPLAY.color,
  };
}
