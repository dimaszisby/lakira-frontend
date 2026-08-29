import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useOrganizationId } from "@/features/organizations/context";
import { isAbortError } from "@/src/services/api/isAbortError";

import { getDashboardVisualizations, getMetricVisualization } from "./api";
import { vizKeys } from "./keys";
import type { VizQuery, VizResponse } from "./types";

export function useMetricVisualization(
  metricId: string,
  query: VizQuery,
  opts?: { enabled?: boolean; staleTime?: number; gcTime?: number },
) {
  const organizationId = useOrganizationId();
  const { enabled = true, staleTime = 60_000, gcTime = 5 * 60_000 } = opts ?? {};
  return useQuery<VizResponse, Error, VizResponse>({
    queryKey: vizKeys.byMetric(organizationId, metricId, query),
    queryFn: ({ signal }) => getMetricVisualization(metricId, query, { signal }),
    enabled,
    staleTime,
    gcTime,
    placeholderData: keepPreviousData,
    retry: (count, err) => !isAbortError(err) && count < 2,
  });
}

export function useDashboardVisualizations(
  q: VizQuery & { limit?: number },
  opts?: { enabled?: boolean; staleTime?: number; gcTime?: number },
) {
  const organizationId = useOrganizationId();
  const { enabled = true, staleTime = 60_000, gcTime = 5 * 60_000 } = opts ?? {};

  return useQuery<
    ReturnType<typeof getDashboardVisualizations> extends Promise<infer R> ? R : never,
    Error,
    ReturnType<typeof getDashboardVisualizations> extends Promise<infer R> ? R : never
  >({
    queryKey: vizKeys.dashboard(organizationId, q),
    queryFn: ({ signal }) => getDashboardVisualizations(q, { signal }),
    enabled,
    staleTime,
    gcTime,
    placeholderData: keepPreviousData,
    retry: (count, err) => !isAbortError(err) && count < 2,
  });
}
