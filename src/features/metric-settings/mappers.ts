import { MetricSettingsResponseDTO } from "@/src/types/dtos/metric-settings.dto";
import { MetricSettingsExtendedVM } from "./view-models";

export function toMetricSettingsExtendedVM(
  dto: MetricSettingsResponseDTO
): MetricSettingsExtendedVM {
  return {
    id: dto.id,
    metricId: dto.metricId,
    goalEnabled: dto.goalEnabled ?? false,
    goalType: dto.goalType,
    goalValue: dto.goalValue,
    timeFrameEnabled: dto.timeFrameEnabled ?? false,
    startDate: dto.startDate ? new Date(dto.startDate) : null,
    deadlineDate: dto.deadlineDate ? new Date(dto.deadlineDate) : null,
    alertEnabled: dto.alertEnabled ?? false,
    alertThresholds: dto.alertThresholds,
    isAchieved: dto.isAchieved ?? false,
    isActive: dto.isActive ?? false,
    displayOptions: {
      showOnDashboard: dto.displayOptions?.showOnDashboard ?? false,
      priority: dto.displayOptions?.priority ?? null,
      chartType: dto.displayOptions?.chartType ?? null,
      color: dto.displayOptions?.color ?? null,
    },
    createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
    updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
  };
}