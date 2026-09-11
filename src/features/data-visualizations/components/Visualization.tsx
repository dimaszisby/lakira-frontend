"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";

import GranularityPicker from "@/features/data-visualizations/components/GranularityPicker";
import MetricChart from "@/features/data-visualizations/components/MetricChart";
import TimeRangePicker from "@/features/data-visualizations/components/TimeRangePicker";
import { useMetricVisualization } from "@/features/data-visualizations/hooks";
import type {
  BucketAlias,
  RelativeLast,
  TimeRangeValue,
} from "@/features/data-visualizations/types";
import {
  buildVizQuery,
  DEFAULT_FILL,
  DEFAULT_TZ,
} from "@/features/data-visualizations/viz-helpers";

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

const paramKeys = (searchParamKey: string) => ({
  bucket: `${searchParamKey}-bucket`,
  range: `${searchParamKey}-range`,
  start: `${searchParamKey}-start`,
  end: `${searchParamKey}-end`,
});

const parseBucket = (searchParams: URLSearchParams, searchParamKey: string): BucketAlias => {
  const bucket = searchParams.get(paramKeys(searchParamKey).bucket);
  return isBucketAlias(bucket) ? bucket : DEFAULT_BUCKET;
};

const parseRange = (searchParams: URLSearchParams, searchParamKey: string): TimeRangeValue => {
  const keys = paramKeys(searchParamKey);
  const range = searchParams.get(keys.range);
  if (isRelativeLast(range)) return { mode: "relative", last: range };

  const start = searchParams.get(keys.start);
  const end = searchParams.get(keys.end);
  if (isValidIso(start) && isValidIso(end)) return { mode: "absolute", start, end };

  return { mode: "relative", last: DEFAULT_LAST };
};

const buildSyncedParams = (
  searchParams: URLSearchParams,
  searchParamKey: string,
  nextRange: TimeRangeValue,
  nextBucket: BucketAlias,
) => {
  const params = new URLSearchParams(searchParams.toString());
  const keys = paramKeys(searchParamKey);

  params.set(keys.bucket, nextBucket);

  if (nextRange.mode === "relative") {
    params.set(keys.range, nextRange.last);
    params.delete(keys.start);
    params.delete(keys.end);
    return params;
  }

  params.delete(keys.range);
  if (nextRange.start) params.set(keys.start, nextRange.start);
  else params.delete(keys.start);
  if (nextRange.end) params.set(keys.end, nextRange.end);
  else params.delete(keys.end);

  return params;
};

type VisualizationProps = {
  metricId: string;
  goalValue?: number | null;
  searchParamKey?: string;
};

const Visualization = ({ metricId, goalValue, searchParamKey = "view" }: VisualizationProps) => {
  const rawSearchParams = useSearchParams();
  const router = useRouter();
  const searchParams = useMemo(
    () => new URLSearchParams(rawSearchParams.toString()),
    [rawSearchParams],
  );

  const bucket = useMemo(
    () => parseBucket(searchParams, searchParamKey),
    [searchParams, searchParamKey],
  );
  const range = useMemo(
    () => parseRange(searchParams, searchParamKey),
    [searchParams, searchParamKey],
  );

  // A range change can follow a bucket change before the URL round-trips.
  const latestBucketRef = useRef<BucketAlias>(bucket);
  const latestRangeRef = useRef<TimeRangeValue>(range);

  useEffect(() => {
    latestBucketRef.current = bucket;
    latestRangeRef.current = range;
  }, [bucket, range]);

  const syncSearchParams = (nextRange: TimeRangeValue, nextBucket: BucketAlias) => {
    const nextQuery = buildSyncedParams(
      searchParams,
      searchParamKey,
      nextRange,
      nextBucket,
    ).toString();
    router.replace(nextQuery ? `?${nextQuery}` : "?", { scroll: false });
  };

  const handleBucketChange = (nextBucket: BucketAlias) => {
    if (!isBucketAlias(nextBucket)) return;
    latestBucketRef.current = nextBucket;
    syncSearchParams(latestRangeRef.current, nextBucket);
  };

  const handleRangeChange = (nextRange: TimeRangeValue) => {
    latestRangeRef.current = nextRange;
    syncSearchParams(nextRange, latestBucketRef.current);
  };

  const query = useMemo(
    () => buildVizQuery(range, bucket, DEFAULT_TZ, DEFAULT_FILL),
    [range, bucket],
  );

  const { data, isLoading } = useMetricVisualization(metricId, query, { staleTime: 60_000 });

  let body: ReactNode;
  if (isLoading) {
    body = <div role="status" aria-label="Loading visualization" className="skeleton h-full" />;
  } else if (!data) {
    body = (
      <div className="grid h-full place-items-center rounded-md border border-border bg-surface2">
        <p className="text-body2 text-ink-secondary">No visualization data available.</p>
      </div>
    );
  } else {
    body = <MetricChart data={data} goalValue={goalValue ?? null} />;
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-h3">Visualization</h2>
        <div className="flex gap-2">
          <GranularityPicker value={bucket} onChange={handleBucketChange} />
          <TimeRangePicker value={range} onChange={handleRangeChange} />
        </div>
      </div>

      <div className="h-80">{body}</div>
    </section>
  );
};

export default Visualization;
