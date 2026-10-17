"use client";

import "chartjs-adapter-date-fns";

import type { ChartData, ChartOptions, TooltipItem } from "chart.js";
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
} from "chart.js";
import { memo, useId, useMemo } from "react";
import { Line } from "react-chartjs-2";

import { cn } from "@/lib/cn";

import { chartHeightStyle } from "../chartHeightStyle";
import type { VizResponse } from "../types";
import { buildChartSummary, isAllMissing, seriesToXY, toTimeUnit } from "../viz-helpers";

// Prevent double register on HMR
let registered = false;
if (!registered) {
  ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler);
  registered = true;
}

type Props = {
  data: VizResponse;
  metricName: string;
  goalValue?: number | null;
  height?: number;
  className?: string;
};

const MetricChart = ({ data, metricName, goalValue, height = 260, className }: Props) => {
  const summaryId = useId();
  const xy = useMemo(() => seriesToXY(data.series), [data.series]);
  const hasGoal = Number.isFinite(goalValue ?? Number.NaN);
  const normalizedUnit = normalizeUnit(data.meta.unit);
  const nameLabel = normalizeMetricName(metricName);
  const metricLabel = normalizedUnit.length > 0 ? normalizedUnit : "Value";

  if (isAllMissing(xy)) {
    return (
      <div
        className={cn(
          "bg-surface2",
          "flex h-full items-center justify-center rounded-xl",
          "chart-box text-sm text-ink-secondary",
          className,
        )}
        role="status"
        aria-live="polite"
        style={chartHeightStyle(height)}
      >
        No data
      </div>
    );
  }

  const metricSeries = toScatterDataPoints(xy);
  const datasets: ChartData<"line", TimeSeriesPoint[]>["datasets"] = [
    {
      label: metricLabel,
      data: metricSeries,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.25,
      spanGaps: false,
      fill: false,
    },
  ];

  if (hasGoal && typeof goalValue === "number") {
    const goal = goalValue;
    datasets.push({
      label: "Goal",
      data: metricSeries.map((p) => ({ x: p.x, y: goal })),
      borderDash: [6, 6],
      borderWidth: 1,
      pointRadius: 0,
      tension: 0,
    });
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    normalized: true,
    plugins: {
      legend: { display: hasGoal },
      tooltip: {
        intersect: false,
        mode: "nearest",
        callbacks: {
          label: (ctx: TooltipItem<"line">) => {
            const value = getTooltipValue(ctx.raw);
            if (value === null) return "No data";
            return formatTooltipLabel(value, normalizedUnit);
          },
        },
      },
      decimation: { enabled: false },
    },
    scales: {
      x: {
        type: "time",
        time: { unit: toTimeUnit(data.meta.bucket) },
        ticks: { maxRotation: 0, autoSkip: true },
      },
      y: { beginAtZero: false },
    },
  };

  // The summary is a sibling, not a child: the children of role="img" are presentational.
  return (
    <>
      <div
        role="img"
        aria-label={`Metric chart for ${nameLabel}`}
        aria-describedby={summaryId}
        className={cn("chart-box", className)}
        style={chartHeightStyle(height)}
      >
        {/* react-chartjs-2 gives its canvas role="img"; the wrapper is the image readers get. */}
        <Line data={{ datasets }} options={options} aria-hidden />
      </div>
      <p id={summaryId} className="sr-only">
        {buildChartSummary(data, hasGoal ? goalValue : null)}
      </p>
    </>
  );
};

export default memo(MetricChart);

type TimeSeriesPoint = { x: string; y: number };

function toScatterDataPoints(points: ReturnType<typeof seriesToXY>): TimeSeriesPoint[] {
  return points.map((point) => ({
    x: point.x instanceof Date ? point.x.toISOString() : String(point.x),
    y: typeof point.y === "number" && Number.isFinite(point.y) ? point.y : Number.NaN,
  }));
}

function getTooltipValue(raw: unknown): number | null {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : null;
  }

  if (typeof raw === "string") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (raw && typeof raw === "object" && "y" in raw) {
    const pointValue = (raw as { y?: unknown }).y;
    if (typeof pointValue === "number") return Number.isFinite(pointValue) ? pointValue : null;
    if (typeof pointValue === "string") {
      const parsed = Number(pointValue);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }

  return null;
}

function formatTooltipLabel(value: number, unit?: string) {
  return `${value} ${unit ?? ""}`.trim();
}

function normalizeUnit(unit: unknown): string {
  return typeof unit === "string" ? unit.trim() : "";
}

function normalizeMetricName(metricName: unknown): string {
  if (typeof metricName === "string" && metricName.trim().length > 0) return metricName.trim();
  return "unknown metric";
}
