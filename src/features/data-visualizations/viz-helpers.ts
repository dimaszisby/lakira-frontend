import type {
  BucketAlias,
  FillMode,
  RelativeLast,
  TimeRangeValue,
  VizQuery,
  VizSeries,
} from "./types";

export const DEFAULT_TZ = "Asia/Jakarta";
export const DEFAULT_FILL: FillMode = "none";

export function buildVizQuery(
  range: TimeRangeValue,
  bucket: BucketAlias,
  tz: string = DEFAULT_TZ,
  fill: FillMode = DEFAULT_FILL,
): VizQuery {
  return range.mode === "relative"
    ? { last: range.last as RelativeLast, bucket, tz, fill }
    : { start: range.start, end: range.end, bucket, tz, fill };
}

export function toTimeUnit(bucket: BucketAlias): "hour" | "day" | "week" | "month" | "year" {
  switch (bucket) {
    case "1h":
      return "hour";
    case "1d":
      return "day";
    case "1w":
      return "week";
    case "1m":
      return "month";
    case "1y":
      return "year";
  }
}

export type XY = { x: Date | string | number; y: number | null };

export function seriesToXY(series: VizSeries[]): XY[] {
  // keep gaps with NaN (Chart.js draws holes for NaN)
  return series.map((s) => ({
    x: s.bucketStartISO,
    y: s.value == null ? Number.NaN : Number(s.value),
  }));
}

export function isAllMissing(xs: XY[]) {
  // Treat NaN as missing
  return xs.length === 0 || xs.every((p) => !Number.isFinite(p.y as number));
}

// Some backends may send count as string (e.g., pg bitstring mishap). Normalize.
export function toNumberOr<T extends number | string | null | undefined>(v: T, fallback = 0) {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}
