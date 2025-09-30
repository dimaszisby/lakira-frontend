import type { VizQuery } from "./types";

const normalize = (q: VizQuery) =>
  "last" in q
    ? {
        last: q.last,
        bucket: q.bucket,
        tz: q.tz ?? "Asia/Jakarta",
        fill: q.fill ?? "none",
      }
    : {
        start: q.start,
        end: q.end,
        bucket: q.bucket,
        tz: q.tz ?? "Asia/Jakarta",
        fill: q.fill ?? "none",
      };

export const vizKeys = {
  all: ["viz"] as const,

  byMetric: (metricId: string, q: VizQuery) =>
    [...vizKeys.all, "metric", metricId, normalize(q)] as const,

  dashboard: (q: VizQuery & { limit?: number }) =>
    [...vizKeys.all, "dashboard", normalize(q), q.limit ?? 24] as const,
};
