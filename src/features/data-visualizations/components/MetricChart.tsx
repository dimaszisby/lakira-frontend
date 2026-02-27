"use client";

import "chartjs-adapter-date-fns";

import type { ChartData, ChartOptions, ScatterDataPoint } from "chart.js";
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

  const metricSeries = xy as ScatterDataPoint[];
  const datasets: ChartData<"line", ScatterDataPoint[]>["datasets"] = [
    {
      label: data.meta.unit ?? "Value",
      data: metricSeries,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.25,
      spanGaps: false,
      fill: false,
    },
  ];

  if (hasGoal) {
    const goal = goalValue as number;
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
          label: (ctx) => {
            const raw = ctx.raw as ScatterDataPoint | number | null;
            const v = typeof raw === "number" ? raw : (raw as ScatterDataPoint)?.y;
            if (!Number.isFinite(v as number)) return "No data";
            return `${v} ${data.meta.unit || ""}`.trim();
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
      aria-label={`Metric chart for ${data.meta.metricId}`}
      className={className}
      style={{ height }}
    >
      <Line data={{ datasets }} options={options} />
    </div>
  );
};

export default memo(MetricChart);
