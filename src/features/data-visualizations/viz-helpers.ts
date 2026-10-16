import type {
  BucketAlias,
  FillMode,
  RelativeLast,
  TimeRangeValue,
  VizQuery,
  VizResponse,
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

// A fixed locale, and dates in the series' own zone: the dashboard renders this on the server as
// well as in the browser, and the two must write the same text (kit chart-text-summary, D-02).
const SUMMARY_LOCALE = "en-GB";
const SUMMARY_NUMBER = new Intl.NumberFormat(SUMMARY_LOCALE, { maximumFractionDigits: 2 });

const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

// The chart's text alternative, required by docs/reference/accessibility-baseline.md § 7.3.
// The span is the first to the last bucket, which is what the x axis draws; meta.range's end is
// exclusive and would overstate it. A figure the backend could not compute is left out.
export function buildChartSummary(data: VizResponse, goalValue?: number | null): string {
  const unit = typeof data.meta.unit === "string" ? data.meta.unit.trim() : "";
  const withUnit = (n: number) => `${SUMMARY_NUMBER.format(n)}${unit ? ` ${unit}` : ""}`;

  const figures = (
    [
      ["average", data.stats.average],
      ["minimum", data.stats.min],
      ["maximum", data.stats.max],
    ] as const
  ).flatMap(([name, value]) => (isFiniteNumber(value) ? [`${name} ${withUnit(value)}`] : []));

  const count = toNumberOr(data.stats.count);
  const logs = `${count} ${count === 1 ? "log" : "logs"}`;
  const body = figures.length > 0 ? `${figures.join(", ")}, from ${logs}` : logs;
  const goal = isFiniteNumber(goalValue) ? ` Goal ${withUnit(goalValue)}.` : "";

  return `${describeSpan(data.series, data.meta.tz)}: ${body}.${goal}`;
}

function summaryDateFormat(tz: string): Intl.DateTimeFormat {
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  try {
    return new Intl.DateTimeFormat(SUMMARY_LOCALE, { ...options, timeZone: tz });
  } catch {
    return new Intl.DateTimeFormat(SUMMARY_LOCALE, { ...options, timeZone: "UTC" });
  }
}

function describeSpan(series: VizSeries[], tz: string): string {
  const format = summaryDateFormat(tz);
  const formatBucket = (iso: string | undefined) => {
    const ms = iso ? Date.parse(iso) : Number.NaN;
    return Number.isFinite(ms) ? format.format(ms) : "";
  };
  const first = formatBucket(series[0]?.bucketStartISO);
  const last = formatBucket(series.at(-1)?.bucketStartISO);
  if (!first || !last) return "Over the selected range";
  return first === last ? `On ${first}` : `From ${first} to ${last}`;
}

// Some backends may send count as string (e.g., pg bitstring mishap). Normalize.
export function toNumberOr<T extends number | string | null | undefined>(v: T, fallback = 0) {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}
