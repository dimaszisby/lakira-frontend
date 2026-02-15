"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import GranularityPicker from "@/features/data-visualizations/components/GranularityPicker";
import MetricChart from "@/features/data-visualizations/components/MetricChart";
import TimeRangePicker from "@/features/data-visualizations/components/TimeRangePicker";
import { useMetricVisualization } from "@/features/data-visualizations/hooks";
import type { BucketAlias, RelativeLast, TimeRangeValue } from "@/features/data-visualizations/types";
import { buildVizQuery,DEFAULT_FILL, DEFAULT_TZ } from "@/features/data-visualizations/viz-helpers";

const DEFAULT_BUCKET: BucketAlias = "1d";
const DEFAULT_LAST: RelativeLast = "30d";
const RELATIVE_LAST_RE = /^\d+(h|d|w|m|y)$/;
const SUPPORTED_BUCKETS: BucketAlias[] = ["1h", "1d", "1w", "1m", "1y"];

const isBucketAlias = (value: string | null): value is BucketAlias =>
  !!value && SUPPORTED_BUCKETS.includes(value as BucketAlias);

const isRelativeLast = (value: string | null): value is RelativeLast =>
  !!value && RELATIVE_LAST_RE.test(value);

const isValidIso = (value: string | null): value is string =>
  !!value && Number.isFinite(Date.parse(value));

function toBucketParamKey(searchParamKey: string) {
  return `${searchParamKey}-bucket`;
}

function toRangeParamKey(searchParamKey: string) {
  return `${searchParamKey}-range`;
}

function toRangeStartParamKey(searchParamKey: string) {
  return `${searchParamKey}-start`;
}

function toRangeEndParamKey(searchParamKey: string) {
  return `${searchParamKey}-end`;
}

function parseInitialBucket(searchParams: URLSearchParams, searchParamKey: string): BucketAlias {
  const bucket = searchParams.get(toBucketParamKey(searchParamKey));
  return isBucketAlias(bucket) ? bucket : DEFAULT_BUCKET;
}

function parseInitialRange(searchParams: URLSearchParams, searchParamKey: string): TimeRangeValue {
  const range = searchParams.get(toRangeParamKey(searchParamKey));
  if (isRelativeLast(range)) return { mode: "relative", last: range };

  const start = searchParams.get(toRangeStartParamKey(searchParamKey));
  const end = searchParams.get(toRangeEndParamKey(searchParamKey));
  if (isValidIso(start) && isValidIso(end)) return { mode: "absolute", start, end };

  return { mode: "relative", last: DEFAULT_LAST };
}

function buildSyncedParams(
  searchParams: URLSearchParams,
  searchParamKey: string,
  nextRange: TimeRangeValue,
  nextBucket: BucketAlias,
) {
  const sp = new URLSearchParams(searchParams.toString());
  const bucketKey = toBucketParamKey(searchParamKey);
  const rangeKey = toRangeParamKey(searchParamKey);
  const startKey = toRangeStartParamKey(searchParamKey);
  const endKey = toRangeEndParamKey(searchParamKey);

  sp.set(bucketKey, nextBucket);

  if (nextRange.mode === "relative") {
    sp.set(rangeKey, nextRange.last);
    sp.delete(startKey);
    sp.delete(endKey);
    return sp;
  }

  sp.delete(rangeKey);
  if (nextRange.start) sp.set(startKey, nextRange.start);
  else sp.delete(startKey);

  if (nextRange.end) sp.set(endKey, nextRange.end);
  else sp.delete(endKey);

  return sp;
}

type VisualizationProps = {
  metricId: string;
  goalValue?: number | null;
  searchParamKey?: string;
};

const Visualization = ({ metricId, goalValue, searchParamKey = "view" }: VisualizationProps) => {
  const rawSearchParams = useSearchParams();
  const router = useRouter();
  const searchParams = useMemo(() => new URLSearchParams(rawSearchParams.toString()), [rawSearchParams]);

  const [bucket, setBucket] = useState<BucketAlias>(() =>
    parseInitialBucket(searchParams, searchParamKey),
  );
  const [range, setRange] = useState<TimeRangeValue>(() =>
    parseInitialRange(searchParams, searchParamKey),
  );

  const syncSearchParams = (nextRange: TimeRangeValue, nextBucket: BucketAlias) => {
    const nextParams = buildSyncedParams(searchParams, searchParamKey, nextRange, nextBucket);
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `?${nextQuery}` : "?", { scroll: false });
  };

  const handleBucketChange = (nextBucket: BucketAlias) => {
    if (!isBucketAlias(nextBucket)) return;
    setBucket(nextBucket);
    syncSearchParams(range, nextBucket);
  };

  const handleRangeChange = (nextRange: TimeRangeValue) => {
    setRange(nextRange);
    syncSearchParams(nextRange, bucket);
  };

  const query = useMemo(
    () => buildVizQuery(range, bucket, DEFAULT_TZ, DEFAULT_FILL),
    [range, bucket],
  );

  const { data, isLoading } = useMetricVisualization(metricId, query, {
    staleTime: 60_000,
  });

  const controls = (
    <div className="flex gap-2">
      <GranularityPicker value={bucket} onChange={handleBucketChange} />
      <TimeRangePicker value={range} onChange={handleRangeChange} />
    </div>
  );

  if (isLoading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Visualization</h2>
          {controls}
        </div>
        <div className="h-[320px]">
          <div
            className="bg-muted h-full animate-pulse rounded-md"
            role="status"
            aria-label="Loading visualization"
          />
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Visualization</h2>
          {controls}
        </div>
        <div className="grid h-[320px] place-items-center rounded-md border border-border bg-surface2">
          <p className="text-sm text-ink-secondary">No visualization data available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between">
        <h2 className="pb-2 text-h3 sm:pb-2 lg:pb-0">Visualization</h2>
        {controls}
      </div>

      <div className="h-[320px]">
        <MetricChart data={data} goalValue={goalValue ?? null} />
      </div>
    </section>
  );
};

export default Visualization;
