import type { ChartType } from "./constants";

export function isChartType(x: unknown): x is ChartType {
  return x === "line" || x === "bar" || x === "area" || x === "pie";
}
