import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useOrganizationId } from "@/features/organizations/context";

import { invalidateMetricLists } from "../cache";
import { createMetricDummy } from "../metric.api";
import type { GenerateDummyMetricsRequestDTO, MetricResponseDTO } from "../metric.dto";

export function useCreateMetricDummy(onSuccess?: () => void, onError?: (error: Error) => void) {
  const qc = useQueryClient();
  const organizationId = useOrganizationId();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricResponseDTO[],
    Error,
    GenerateDummyMetricsRequestDTO
  >({
    mutationFn: (payload) => createMetricDummy(payload),
    onSuccess: async () => {
      await invalidateMetricLists(qc, organizationId);
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
