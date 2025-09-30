import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { VizQuery, VizResponse } from "./types";
import { getDashboardVisualizations, getMetricVisualization } from "./api";
import { vizKeys } from "./keys";
import { isAbortError } from "@/src/services/api/isAbortError";

export function useMetricVisualization(
  metricId: string,
  query: VizQuery,
  opts?: { enabled?: boolean; staleTime?: number; gcTime?: number }
) {
  const {
    enabled = true,
    staleTime = 60_000,
    gcTime = 5 * 60_000,
  } = opts ?? {};
  return useQuery<VizResponse, Error, VizResponse>({
    queryKey: vizKeys.byMetric(metricId, query),
    queryFn: ({ signal }) =>
      getMetricVisualization(metricId, query, { signal }),
    enabled,
    staleTime,
    gcTime,
    placeholderData: keepPreviousData,
    retry: (count, err) => !isAbortError(err) && count < 2,
  });
}

export function useDashboardVisualizations(
  q: VizQuery & { limit?: number },
  opts?: { enabled?: boolean; staleTime?: number; gcTime?: number }
) {
  const {
    enabled = true,
    staleTime = 60_000,
    gcTime = 5 * 60_000,
  } = opts ?? {};

  return useQuery<
    ReturnType<typeof getDashboardVisualizations> extends Promise<infer R>
      ? R
      : never,
    Error,
    ReturnType<typeof getDashboardVisualizations> extends Promise<infer R>
      ? R
      : never
  >({
    queryKey: vizKeys.dashboard(q),
    queryFn: () => getDashboardVisualizations(q),
    enabled,
    staleTime,
    gcTime,
    placeholderData: keepPreviousData,
    retry: (count, err) => !isAbortError(err) && count < 2,
  });
}
