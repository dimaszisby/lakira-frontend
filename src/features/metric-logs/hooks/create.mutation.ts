import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { MetricLogResponseDTO } from "@/types/dtos/metric-log.dto";

import { createMetricLog } from "../api";
import { invalidateLogLists } from "../cache";

export function useCreateMetricLog(
  onSuccess?: (created: MetricLogResponseDTO) => void,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: createMetricLog,
    onSuccess: async (created) => {
      await invalidateLogLists(qc);
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
