import type { UserMetricDetailResponseDTO } from "@/features/metrics/metric.dto";

import type { MetricSettingsExtendedVM } from "../metric-settings/view-models";
import { DEFAULT_DISPLAY, isChartType } from "../metric-settings/view-models";
import type { MetricHeaderVM } from "./view-models";

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

// MetricSetting section of MetricDetailsPage
// TODO: Shared/centralized because of dupplications
export function toMetricSettingsVM(d: UserMetricDetailResponseDTO): MetricSettingsExtendedVM {
  const s = d.settings;
  if (!s) {
    return {
      metricId: d.id,
      goalEnabled: false,
      goalType: null,
      goalValue: null,
      timeFrameEnabled: false,
      startDate: null,
      deadlineDate: null,
      alertEnabled: false,
      alertThresholds: 0,
      isAchieved: false,
      isActive: false,
      displayOptions: {
        showOnDashboard: DEFAULT_DISPLAY.showOnDashboard,
        priority: DEFAULT_DISPLAY.priority,
        chartType: DEFAULT_DISPLAY.chartType,
        color: DEFAULT_DISPLAY.color,
      },
    };
  }

  const displayOptions = {
    showOnDashboard: s.displayOptions?.showOnDashboard ?? DEFAULT_DISPLAY.showOnDashboard,
    priority: s.displayOptions?.priority ?? DEFAULT_DISPLAY.priority,
    chartType: isChartType(s.displayOptions?.chartType)
      ? s.displayOptions!.chartType
      : DEFAULT_DISPLAY.chartType,
    color: s.displayOptions?.color ?? DEFAULT_DISPLAY.color,
  };

  return {
    id: s.id,
    metricId: d.id,
    goalEnabled: s.goalEnabled ?? false,
    goalType: s.goalType ?? null,
    goalValue: s.goalValue ?? null,
    timeFrameEnabled: s.timeFrameEnabled ?? false,
    startDate: s.startDate ? s.startDate : null,
    deadlineDate: s.deadlineDate ? s.deadlineDate : null,
    alertEnabled: s.alertEnabled ?? false,
    alertThresholds: s.alertThresholds ?? 0,
    isAchieved: s.isAchieved ?? false,
    isActive: s.isActive ?? false,
    displayOptions: {
      showOnDashboard: displayOptions.showOnDashboard ?? false,
      priority: displayOptions.priority,
      chartType: displayOptions.chartType,
      color: displayOptions.color,
    },
    createdAt: s.createdAt ? s.createdAt : undefined,
    updatedAt: s.updatedAt ? s.updatedAt : undefined,
  };
}

// export function toMetricSettingsVM(
//   settings?: MetricSettingsResponseDTO | null
// ): MetricSettingsVM {
//   if (!settings) {
//     // not included or not configured
//     return {
//       id: null,
//       isActive: null,
//       goalType: null,
//       goalValue: null,
//       startDate: null,
//       deadlineDate: null,
//       alertThresholds: null,
//       display: null,
//     };
//   }

//   // normalize nested display
//   const d = settings.displayOptions;
//   const display: DisplayVM = {
//     showOnDashboard: d?.showOnDashboard ?? DEFAULT_DISPLAY.showOnDashboard,
//     priority: d?.priority ?? DEFAULT_DISPLAY.priority,
//     chartType: isChartType(d?.chartType)
//       ? d!.chartType
//       : DEFAULT_DISPLAY.chartType,
//     color: d?.color ?? DEFAULT_DISPLAY.color,
//   };

//   return {
//     id: settings.id,
//     isActive: settings.isActive,
//     goalType: settings.goalEnabled ? settings.goalType ?? null : null,
//     goalValue: settings.goalEnabled ? settings.goalValue ?? null : null,
//     startDate: settings.timeFrameEnabled ? settings.startDate ?? null : null,
//     deadlineDate: settings.timeFrameEnabled
//       ? settings.deadlineDate ?? null
//       : null,
//     alertThresholds: settings.alertEnabled
//       ? settings.alertThresholds ?? null
//       : null,
//     display,
//   };
// }
