"use client";

import { memo } from "react";

import MetricChart from "@/features/data-visualizations/components/MetricChart";
import type { DashboardVizItem } from "@/features/data-visualizations/types";
import CategoryChip from "@/features/metric-categories/components/CategoryChip";
import { toCategoryUI } from "@/features/metric-categories/presenters/toCategoryUI";
import Card, { CardHeader, CardTitle } from "@/ui/Card";

const MetricCardFromBatch = memo(function MetricCardFromBatch({
  item,
  bucket,
  tz,
  range,
}: {
  item: DashboardVizItem;
  bucket: "1h" | "1d" | "1w" | "1m" | "1y";
  tz: string;
  range: { startISO: string; endISO: string };
}) {
  const data = {
    series: item.series,
    stats: item.stats,
    meta: {
      metricId: item.metricId,
      name: item.name,
      unit: item.unit,
      bucket,
      tz,
      range,
    },
  } as const;

  const categoryUI = toCategoryUI({
    id: item.metricId,
    name: item.category_name,
    color: item.category_color,
    icon: item.category_icon,
  });

  return (
    <Card size="sm">
      <CardHeader>
        <CategoryChip variant="secondary" category={categoryUI} className="w-fit" />
        <CardTitle className="line-clamp-1">{item.name}</CardTitle>
      </CardHeader>

      <div className="h-64">
        <MetricChart data={data} goalValue={null} />
      </div>

      <div className="text-muted-foreground flex gap-4 text-xs">
        <span>avg: {item.stats.average ?? "—"}</span>
        <span>min: {item.stats.min ?? "—"}</span>
        <span>max: {item.stats.max ?? "—"}</span>
        <span>n: {item.stats.count ?? 0}</span>
      </div>
    </Card>
  );
});

MetricCardFromBatch.displayName = "MetricCardFromBatch";

export default MetricCardFromBatch;
