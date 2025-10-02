import api from "@/src/services/api/api";
import { withApiErrorHandling } from "@/src/services/api/withApiErrorHandling";
import type ApiResponse from "@/types/generics/ApiResponse";
import { unwrap } from "@/types/generics/ApiResponse";

import type { DashboardVizResponse, VizQuery, VizResponse } from "./types";
import { etagCache } from "./utils/etag-cache";

const BASE = "/analytics";

// helper
function normalizeParams(query: VizQuery & { limit?: number }) {
  if ("last" in query) {
    return {
      last: query.last,
      bucket: query.bucket,
      tz: query.tz ?? "Asia/Jakarta",
      fill: query.fill ?? "none",
      ...(query.limit ? { limit: String(query.limit) } : {}),
    };
  }
  return {
    start: query.start,
    end: query.end,
    bucket: query.bucket,
    tz: query.tz ?? "Asia/Jakarta",
    fill: query.fill ?? "none",
    ...(query.limit ? { limit: String(query.limit) } : {}),
  };
}

export async function getMetricVisualization(
  metricId: string,
  query: VizQuery,
  opts: { signal?: AbortSignal } = {},
): Promise<VizResponse> {
  return withApiErrorHandling(async () => {
    const params = normalizeParams(query);
    const url = `${BASE}/metrics/${metricId}`;
    const key = etagCache.keyFrom(url, params);

    const headers: Record<string, string> = {};
    const prevEtag = etagCache.getEtag(key);
    if (prevEtag) headers["If-None-Match"] = prevEtag;

    const res = await api.get<ApiResponse<VizResponse>>(url, {
      params,
      signal: opts.signal,
      headers,
      validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    });

    // 304 -> return cached payload
    if (res.status === 304) {
      const cached = etagCache.getPayload<VizResponse>(key);
      if (cached) return cached;
      // fallthrough if no cache (rare): treat as error
      throw new Error("304 received but no cached payload");
    }

    const data = unwrap(res);
    etagCache.set(key, res.headers?.etag as string | undefined, data);
    return data;
  }, "fetchedSingularMetricAnalytics");
}

export async function getDashboardVisualizations(q: VizQuery & { limit?: number }) {
  return withApiErrorHandling(async () => {
    const params = normalizeParams(q);
    const url = `${BASE}/dashboard`;
    const key = etagCache.keyFrom(url, params);

    const headers: Record<string, string> = {};
    const prevEtag = etagCache.getEtag(key);
    if (prevEtag) headers["If-None-Match"] = prevEtag;

    const res = await api.get<ApiResponse<DashboardVizResponse>>(url, {
      params,
      headers,
      validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    });

    if (res.status === 304) {
      const cached = etagCache.getPayload<DashboardVizResponse>(key);
      if (cached) return cached;
      throw new Error("304 received but no cached payload");
    }

    const data = unwrap(res);
    etagCache.set(key, res.headers?.etag as string | undefined, data);
    return data;
  }, "fetchedDashbordAnalytics");
}
