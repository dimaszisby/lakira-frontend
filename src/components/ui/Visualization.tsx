"use client";
import { useMemo, useState } from "react";

import GranularityPicker from "@/src/features/data-visualizations/components/GranularityPicker";
import MetricChart from "@/src/features/data-visualizations/components/MetricChart";
import TimeRangePicker from "@/src/features/data-visualizations/components/TimeRangePicker";
import { useMetricVisualization } from "@/src/features/data-visualizations/hooks";
import type { BucketAlias, TimeRangeValue } from "@/src/features/data-visualizations/types";
import {
  buildVizQuery,
  DEFAULT_FILL,
  DEFAULT_TZ,
} from "@/src/features/data-visualizations/viz-helpers";

/**
 * Singular Metric Visualization
 * @description metric visualization component for singular metric, used in Detail Pages
 */

const Visualization = ({
  metricId,
  goalValue,
}: {
  metricId: string;
  goalValue?: number | null;
  // Dev Note: Currently goal value passed from MetricDetails (Parent Page) when fetching MetricDetailsExtented object to limit out API resource usage
}) => {
  const [bucket, setBucket] = useState<BucketAlias>("1d");
  const [range, setRange] = useState<TimeRangeValue>({
    mode: "relative",
    last: "30d",
  });

  const query = useMemo(
    () => buildVizQuery(range, bucket, DEFAULT_TZ, DEFAULT_FILL),
    [range, bucket],
  );

  const { data, isLoading } = useMetricVisualization(metricId, query, {
    staleTime: 60_000,
  });

  // ⬇️ Early narrow so 'data' is definitely VizResponse after this return
  if (isLoading || !data) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Visualization</h2>
          <div className="flex gap-2">
            <GranularityPicker value={bucket} onChange={setBucket} />
            <TimeRangePicker value={range} onChange={setRange} />
          </div>
        </div>
        <div className="h-[320px]">
          <div className="bg-muted h-full animate-pulse rounded-md" />
        </div>
      </section>
    );
  }

  // ⬇️ From here 'data' is VizResponse (narrowed by the guard above)
  return (
    <section className="space-y-3 bg-red-100">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Visualization</h2>
        <div className="flex gap-2">
          <GranularityPicker value={bucket} onChange={setBucket} />
          <TimeRangePicker value={range} onChange={setRange} />
        </div>
      </div>

      <div className="h-[320px] bg-yellow-100">
        <MetricChart data={data} goalValue={goalValue ?? null} />
      </div>
    </section>
  );
};

export default Visualization;
