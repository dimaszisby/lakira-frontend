import type { DisplayVM } from "./view-models";

export type GoalType = "cumulative" | "incremental";
export type ChartType = "line" | "bar" | "area" | "pie";

export const DEFAULT_DISPLAY: DisplayVM = {
  showOnDashboard: false,
  priority: 1,
  chartType: "line",
  color: "#E897A3",
};
