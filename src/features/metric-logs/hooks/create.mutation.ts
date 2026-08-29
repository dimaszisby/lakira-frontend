import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateMetricVisualization } from "@/features/data-visualizations/cache";
import { useOrganizationId } from "@/features/organizations/context";
import type { CreateMetricLogRequestDTO, MetricLogResponseDTO } from "@/types/dtos/metric-log.dto";

import { createMetricLog } from "../api";
import { invalidateLogLists } from "../cache";

export function useCreateMetricLog(
  onSuccess?: (created: MetricLogResponseDTO) => void,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const organizationId = useOrganizationId();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricLogResponseDTO,
    Error,
    CreateMetricLogRequestDTO
  >({
    mutationFn: (payload) => createMetricLog(payload),
    onSuccess: async (created, payload) => {
      await invalidateLogLists(qc, organizationId);
      await invalidateMetricVisualization(qc, organizationId, payload.metricId);
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
