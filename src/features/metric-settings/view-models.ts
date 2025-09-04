type GoalType = "cumulative" | "incremental";
type ChartType = "line" | "bar" | "area" | "pie";

export type MetricSettingsVM = {
  id?: string | null;
  isActive: boolean | null;
  goalType: GoalType | null;
  goalValue: number | null;
  startDate: string | null; // ISO date (yyyy-mm-dd) as string
  deadlineDate: string | null;
  alertEnabled: boolean | null;
  alertThresholds: number | null;
  display: DisplayVM | null; // nested VM
};

// Will be used a core business VM
export type MetricSettingsExtendedVM = {
  id?: string | null;
  metricId: string;
  goalEnabled: boolean;
  goalType: GoalType | null;
  goalValue: number | null;
  timeFrameEnabled: boolean;
  startDate: Date | null;
  deadlineDate: Date | null;
  alertEnabled: boolean;
  alertThresholds: number | null;
  isAchieved: boolean;
  isActive: boolean;
  displayOptions: {
    showOnDashboard: boolean | null;
    priority: number | null;
    chartType: string | null;
    color: string | null;
  };
  createdAt?: Date;
  updatedAt?: Date;
};

export type DisplayVM = {
  showOnDashboard: boolean | null;
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
