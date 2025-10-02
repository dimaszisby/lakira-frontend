import type { MetricSettingsResponseDTO } from "@/src/types/dtos/metric-settings.dto";

import type { MetricSettingsExtendedVM } from "./view-models";
import { DEFAULT_DISPLAY } from "./view-models";

export function toMetricSettingsExtendedVM(
  dto: MetricSettingsResponseDTO,
): MetricSettingsExtendedVM {
  return {
    id: dto.id,
    metricId: dto.metricId,
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

    displayOptions: {
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
    },

    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}
