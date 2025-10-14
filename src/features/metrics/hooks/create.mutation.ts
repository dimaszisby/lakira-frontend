import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateMetricLists } from "../cache";
import { createMetric } from "../metric.api";
import type { MetricResponseDTO } from "../metric.dto";

export default function useCreateMetric(
  onSuccess?: (created: MetricResponseDTO) => void,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: createMetric,
    onSuccess: async (created) => {
      await invalidateMetricLists(qc);

      // Optional: optimistic stitch into the *current* first page if you want:
      // qc.setQueryData(metricsKeys.list({ page: 1, limit: 20, sortBy: "createdAt", sortOrder: "DESC" }), (old: any) => ...);

      onSuccess?.(created);
    },
    onError,
  });

  return { createMetric: mutateAsync, isError, isSuccess, error, isPending };
}
