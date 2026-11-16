"use client";

import { Info } from "@phosphor-icons/react";
import { memo } from "react";

import MetricChart from "@/features/data-visualizations/components/MetricChart";
import type { DashboardVizItem } from "@/features/data-visualizations/types";
import { describeRange } from "@/features/data-visualizations/viz-helpers";
import CategoryChip from "@/features/metric-categories/components/CategoryChip";
import { toCategoryUI } from "@/features/metric-categories/presenters/toCategoryUI";
import { Card, CardHeader, CardTitle } from "@/ui/Card";

const MetricCardFromBatch = memo(function MetricCardFromBatch({
  item,
  tz,
}: {
  item: DashboardVizItem;
  tz: string;
}) {
  // The item's own range, which is the requested one unless the backend fell back to the last
  // period with logs (#205).
  const { bucket, startISO, endISO } = item.actualRange;

  const data = {
    series: item.series,
    stats: item.stats,
    meta: {
      metricId: item.metricId,
      name: item.name,
      unit: item.unit,
      bucket,
      tz,
      range: { startISO, endISO },
    },
  } as const;

  const categoryUI = toCategoryUI({
    id: item.metricId,
    name: item.category_name ?? "",
    color: item.category_color ?? "",
    icon: item.category_icon ?? "",
  });

  const fallbackDates = item.fallbackRangeUsed ? describeRange(item.actualRange, tz) : null;

  return (
    <Card size="sm">
      <CardHeader>
        <CategoryChip variant="secondary" category={categoryUI} className="w-fit" />
        <CardTitle className="line-clamp-1">{item.name}</CardTitle>
        {item.fallbackRangeUsed ? (
          <p className="flex items-start gap-1 text-caption text-ink-secondary">
            <Info aria-hidden="true" className="mt-px shrink-0" size={14} />
            <span>
              No logs in the selected range. Showing{" "}
              {fallbackDates ? `${fallbackDates}, the last period` : "the last period"} with logs.
            </span>
          </p>
        ) : null}
      </CardHeader>

      <div className="h-64">
        <MetricChart data={data} metricName={item.name} goalValue={null} />
      </div>

      <div className="flex gap-4 text-xs text-ink-secondary">
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
