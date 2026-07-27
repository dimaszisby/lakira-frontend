import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateMetricLogRequestDTO, MetricLogResponseDTO } from "@/types/dtos/metric-log.dto";

import { invalidateMetricVisualization } from "@/features/data-visualizations/cache";

import { createMetricLog } from "../api";
import { invalidateLogLists } from "../cache";

export function useCreateMetricLog(
  onSuccess?: (created: MetricLogResponseDTO) => void,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricLogResponseDTO,
    Error,
    CreateMetricLogRequestDTO
  >({
    mutationFn: (payload) => createMetricLog(payload),
    onSuccess: async (created, payload) => {
      await invalidateLogLists(qc);
      await invalidateMetricVisualization(qc, payload.metricId);
      onSuccess?.(created);
    },
    onError,
  });

  return {
    createMetricLog: mutateAsync,
    isError,
    isSuccess,
    error,
    isPending,
  };
}
