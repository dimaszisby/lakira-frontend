import { useQuery } from "@tanstack/react-query";

import type { PaginatedMetricLogListResponseDTO } from "@/src/types/dtos/metric-log.dto";

import { getMetricLogs } from "../api";

/**
 * @deprecated Use cursor-based pagination instead (useMetricLogsListPaginationViaCursor)
 */
export function useMetricLogListOffset(metricId: string, page: number, limit: number = 20) {
  const { data, isLoading, isError } = useQuery<
    PaginatedMetricLogListResponseDTO | undefined,
    Error
  >({
    // Commented due to caching issue when creating new logs
    queryKey: ["metricLogs", metricId, page, limit],
    // queryKey: ["metricLogs", metricId],
    queryFn: () => getMetricLogs({ metricId, page, limit }),
    placeholderData: (previousData: PaginatedMetricLogListResponseDTO | undefined) => previousData,
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;

  return {
    logs,
    total,
    isLoading,
    isError,
  };
}
