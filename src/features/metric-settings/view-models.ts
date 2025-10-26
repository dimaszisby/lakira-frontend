import type { ISODateTimeString } from "@/types/aliases";
import type { MetricSettingsResponseDTO } from "@/types/dtos/metric-settings.dto";

import type { CursorPageVM } from "../metrics";
import type { ChartType, GoalType } from "./constants";
import type { MetricSettingsFilterViaCursor, MetricSettingsSortableKeyViaCursor } from "./sort";

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
  MetricSettingsSortableKeyViaCursor,
  MetricSettingsFilterViaCursor
>;
