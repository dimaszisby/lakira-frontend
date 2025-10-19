import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { MetricLogResponseDTO } from "@/src/types/dtos/metric-log.dto";

import { createMetricLogDummy } from "../api";
import { invalidateLogLists } from "../cache";

export function useCreateMetricLogDummy(
  onSuccess?: (created: MetricLogResponseDTO[]) => void,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: createMetricLogDummy,
    onSuccess: async (created) => {
      await invalidateLogLists(qc);
      onSuccess?.(created.logs);
    },
    onError,
  });

  return {
    createMetricLogDummy: mutateAsync,
    isError,
    isSuccess,
    error,
    isPending,
  };
}
