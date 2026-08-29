import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useOrganizationId } from "@/features/organizations/context";
import type {
  GenerateDummyMetricLogsRequestDTO,
  MetricLogResponseDTO,
} from "@/types/dtos/metric-log.dto";

import { createMetricLogDummy } from "../api";
import { invalidateLogLists } from "../cache";

export function useCreateMetricLogDummy(
  onSuccess?: (created: MetricLogResponseDTO[]) => void,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const organizationId = useOrganizationId();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    { logs: MetricLogResponseDTO[] },
    Error,
    GenerateDummyMetricLogsRequestDTO
  >({
    mutationFn: (payload) => createMetricLogDummy(payload),
    onSuccess: async (created) => {
      await invalidateLogLists(qc, organizationId);
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
