import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateMetricLists } from "../cache";
import { createMetricDummy } from "../metric.api";
import type { GenerateDummyMetricsRequestDTO, MetricResponseDTO } from "../metric.dto";

export function useCreateMetricDummy(onSuccess?: () => void, onError?: (error: Error) => void) {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricResponseDTO[],
    Error,
    GenerateDummyMetricsRequestDTO
  >({
    mutationFn: (payload) => createMetricDummy(payload),
    onSuccess: async () => {
      await invalidateMetricLists(qc);
      onSuccess?.();
    },
    onError,
  });

  return {
    createMetricDummy: mutateAsync,
    isError,
    isSuccess,
    error,
    isPending,
  };
}
