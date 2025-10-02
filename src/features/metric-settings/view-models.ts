import type { ISODateTimeString } from "@/src/types/aliases";

// TODO - Refactor: to Enum
type GoalType = "cumulative" | "incremental";
type ChartType = "line" | "bar" | "area" | "pie";

export type MetricSettingsExtendedVM = {
  id?: string | null;
  metricId: string;
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

  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
};

export type DisplayVM = {
  showOnDashboard: boolean;
  priority: number | null;
  chartType: ChartType | null; // precise union, not string
  color: string | null;
};

// ===== Helpers & safe defaults =====
// TODO: Refactor
export const DEFAULT_DISPLAY: DisplayVM = {
  showOnDashboard: false,
  priority: 1,
  chartType: "line",
  color: "#E897A3",
};

// TODO: Refactor
export function isChartType(x: unknown): x is ChartType {
  return x === "line" || x === "bar" || x === "area" || x === "pie";
}
