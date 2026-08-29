import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useOrganizationId } from "@/features/organizations/context";

import { metricsKeys } from "../keys";
import { getMetricLibraryList } from "../metric.api";
import type { PaginatedMetricListResponseDTO } from "../metric.dto";
import type { ListOptions, MetricsListParams } from "../types";

export function useMetricsListViaOffset(params: MetricsListParams, opts: ListOptions = {}) {
  const organizationId = useOrganizationId();
  const { data, isLoading, isError } = useQuery<PaginatedMetricListResponseDTO | undefined, Error>({
    queryKey: metricsKeys.list(organizationId, params),
    queryFn: () => getMetricLibraryList(params),
    placeholderData: keepPreviousData,
    enabled: opts.enabled ?? true,
    staleTime: opts.staleTime ?? 15_000,
  });

  const metrics = data?.metrics ?? [];
  const total = data?.total ?? 0;

  return {
    metrics,
    total,
    isLoading,
    isError,
  };
}
