import type { DisplayVM } from "./view-models";

// * Enums
// Dev Note: Still hardcoded for now, will fetch via API in future development
export type GoalType = "cumulative" | "incremental";
export type ChartType = "line" | "bar" | "area" | "pie";

// * Default Values
export const DEFAULT_DISPLAY: DisplayVM = {
  showOnDashboard: false,
  priority: 1,
  chartType: "line",
  color: "#E897A3",
};

// * View Options
type V = string | number;
type Options<T extends V = string> = {
  value: T;
  label: string;
};

export const CHART_OPT: Options<ChartType>[] = [
  { value: "line", label: "Line Chart" },
  { value: "bar", label: "Bar Chart" },
  { value: "area", label: "Area Chart" },
  { value: "pie", label: "Pie Chart" },
];

export const GOAL_TYPE_OPT: Options<GoalType>[] = [
  { value: "incremental", label: "Incremental" },
  { value: "cumulative", label: "Cumulative" },
];

export const PRIORITY_OPT: Options<number>[] = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
];
