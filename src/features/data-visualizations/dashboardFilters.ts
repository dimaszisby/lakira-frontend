import type { ReadonlyURLSearchParams } from "next/navigation";

import type { BucketAlias, RelativeLast, TimeRangeValue } from "./types";

export const DASHBOARD_DEFAULT_BUCKET: BucketAlias = "1d";
export const DASHBOARD_DEFAULT_RANGE: TimeRangeValue = {
  mode: "relative",
  last: "30d",
};

const RELATIVE_RANGE_PATTERN = /^\d+(h|d|w|m|y)$/;
const VALID_BUCKETS: BucketAlias[] = ["1h", "1d", "1w", "1m", "1y"];

export type DashboardFilters = {
  bucket: BucketAlias;
  range: TimeRangeValue;
};

export type DashboardSearchParams =
  | ReadonlyURLSearchParams
  | URLSearchParams
  | {
      bucket?: string | null;
      range?: string | null;
      rangeStart?: string | null;
      rangeEnd?: string | null;
    };

const normalizeRawValue = (
  params: DashboardSearchParams,
): { bucket?: string | null; range?: string | null; rangeStart?: string | null; rangeEnd?: string | null } => {
  if ("get" in params) {
    return {
      bucket: params.get("bucket"),
      range: params.get("range"),
      rangeStart: params.get("rangeStart"),
      rangeEnd: params.get("rangeEnd"),
    };
  }

  return {
    bucket: params.bucket ?? null,
    range: params.range ?? null,
    rangeStart: params.rangeStart ?? null,
    rangeEnd: params.rangeEnd ?? null,
  };
};

export const parseBucketParam = (value?: string | null): BucketAlias => {
  if (value && VALID_BUCKETS.includes(value as BucketAlias)) {
    return value as BucketAlias;
  }
  return DASHBOARD_DEFAULT_BUCKET;
};

export const parseRangeParam = (
  range?: string | null,
  rangeStart?: string | null,
  rangeEnd?: string | null,
): TimeRangeValue => {
  if (range && RELATIVE_RANGE_PATTERN.test(range)) {
    return { mode: "relative", last: range as RelativeLast };
  }

  if (rangeStart && rangeEnd) {
    return { mode: "absolute", start: rangeStart, end: rangeEnd };
  }

  return DASHBOARD_DEFAULT_RANGE;
};

export const parseDashboardFilters = (params: DashboardSearchParams): DashboardFilters => {
  const raw = normalizeRawValue(params);
  return {
    bucket: parseBucketParam(raw.bucket),
    range: parseRangeParam(raw.range, raw.rangeStart, raw.rangeEnd),
  };
};

export const encodeDashboardFilters = (filters: DashboardFilters) => {
  if (filters.range.mode === "relative") {
    return {
      bucket: filters.bucket,
      range: filters.range.last,
    };
  }

  return {
    bucket: filters.bucket,
    rangeStart: filters.range.start,
    rangeEnd: filters.range.end,
  };
};

export const isTimeRangeEqual = (a: TimeRangeValue, b: TimeRangeValue) => {
  if (a.mode !== b.mode) return false;
  if (a.mode === "relative" && b.mode === "relative") {
    return a.last === b.last;
  }

  if (a.mode === "absolute" && b.mode === "absolute") {
    return a.start === b.start && a.end === b.end;
  }

  return false;
};
