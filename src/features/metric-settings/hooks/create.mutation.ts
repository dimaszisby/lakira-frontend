import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { MetricSettingsResponseDTO } from "@/types/dtos/metric-settings.dto";

import { createMetricSettings } from "../api";
import { invalidateMetricSettingsLists } from "../cache";

export function useCreateMetricSettings(
  onSuccess?: (created: MetricSettingsResponseDTO) => void,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: createMetricSettings,
    onSuccess: async (created) => {
      await invalidateMetricSettingsLists(qc);
      await onSuccess?.(created);
    },
    onError,
  });

  return {
    createMetricSettings: mutateAsync,
    onSuccess,
    onError,
    isError,
    isSuccess,
    error,
    isPending,
  };
}
