import type { CursorPageVM } from "@/generics/cursor/view-model";
import type { ISODateTimeString } from "@/src/generics/date/aliases";
import type { MetricSettingsResponseDTO } from "@/types/dtos/metric-settings.dto";

import type { ChartType, GoalType } from "./constants";
import type { MetricSettingsFilter, MetricSettingsSortableKey } from "./sort";

export type MetricSettingsExtendedVM = {
  id: string;

  // Relations
  metricId: string;

  // Base
  isActive: boolean;

  goalEnabled: boolean;
  goalType: GoalType | null;
  goalValue: number | null;
  timeFrameEnabled: boolean;
  startDate: ISODateTimeString | null;
  deadlineDate: ISODateTimeString | null;
  alertEnabled: boolean;
  alertThresholds: number | null;
  isAchieved: boolean;

  displayOptions: DisplayVM;

  // Timestamps
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
};

export type DisplayVM = {
  showOnDashboard: boolean;
  priority: number | null;
  chartType: ChartType | null; // precise union, not string
  color: string | null;
};

export type MetricSettingsCursorPageVM = CursorPageVM<
  MetricSettingsResponseDTO,
  MetricSettingsExtendedVM,
  MetricSettingsSortableKey,
  MetricSettingsFilter
>;
