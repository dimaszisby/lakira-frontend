"use client";

import "chartjs-adapter-date-fns";

import type { ChartData, ChartOptions, ScatterDataPoint, TooltipItem } from "chart.js";
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
import { memo, useMemo } from "react";
import { Line } from "react-chartjs-2";

import { cn } from "@/lib/cn";

import type { VizResponse } from "../types";
import { isAllMissing, seriesToXY, toTimeUnit } from "../viz-helpers";

// Prevent double register on HMR
let registered = false;
if (!registered) {
  ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler);
  registered = true;
}

type Props = {
  data: VizResponse;
  goalValue?: number | null;
  height?: number;
  className?: string;
};

const MetricChart = ({ data, goalValue, height = 260, className }: Props) => {
  const xy = useMemo(() => seriesToXY(data.series), [data.series]);
  const hasGoal = Number.isFinite(goalValue ?? Number.NaN);
  const normalizedUnit = normalizeUnit(data.meta.unit);
  const metricIdLabel = normalizeMetricId(data.meta.metricId);
  const metricLabel = normalizedUnit.length > 0 ? normalizedUnit : "Value";

  if (isAllMissing(xy)) {
    return (
      <div
        className={cn(
          "bg-surface2",
          "flex h-full items-center justify-center rounded-xl",
          "text-sm text-ink-secondary",
          className,
        )}
        role="status"
        aria-live="polite"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  const metricSeries = toScatterDataPoints(xy);
  const datasets: ChartData<"line", ScatterDataPoint[]>["datasets"] = [
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

  return (
    <div
      role="img"
      aria-label={`Metric chart for ${metricIdLabel}`}
      className={className}
      style={{ height }}
    >
      <Line data={{ datasets }} options={options} />
    </div>
  );
};

export default memo(MetricChart);

function toScatterDataPoints(
  points: ReturnType<typeof seriesToXY>,
): ChartData<"line", ScatterDataPoint[]>["datasets"][number]["data"] {
  return points.map((point) => ({
    x: point.x,
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

function normalizeMetricId(metricId: unknown): string {
  if (typeof metricId === "string" && metricId.trim().length > 0) return metricId.trim();
  return "unknown metric";
}
