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
};

const MetricChart = ({ data, goalValue, height = 260 }: Props) => {
  const xy = useMemo(() => seriesToXY(data.series), [data.series]);

  if (isAllMissing(xy)) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center rounded-xl bg-gray-50 text-xs">
        No data
      </div>
    );
  }

  // Dataset with {x,y} pairs. Keep parsing=true (default) so time scale works.
  const datasets: ChartData<"line", (number | ScatterDataPoint | null)[]>["datasets"] = [
    {
      label: data.meta.unit ?? "Value",
      data: xy as unknown as (number | ScatterDataPoint | null)[],
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.25,
      spanGaps: false, // NaN -> holes
      fill: false,
    },
  ];

  if (goalValue != null) {
    datasets.push({
      label: "Goal",
      data: xy.map((p) => ({ x: p.x, y: goalValue })) as unknown as (
        | number
        | ScatterDataPoint
        | null
      )[],
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
      legend: { display: goalValue != null },
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
      decimation: { enabled: false }, // DevNote: buckets limited (<=400)
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
    <div role="img" aria-label={`Metric chart for ${data.meta.metricId}`} style={{ height }}>
      <Line data={{ datasets }} options={options} />
    </div>
  );
};

export default memo(MetricChart);
