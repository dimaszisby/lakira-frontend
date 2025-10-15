import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateMetricLists, removeMetricDetail } from "../cache";
import { metricsKeys } from "../keys";
import { deleteMetric } from "../metric.api";
import type { MetricResponseDTO } from "../metric.dto";

type DeleteCtx = {
  // Temp snapshot all detail variants for restoration
  details: Array<{ key: QueryKey; prev: unknown }>;
};

export function useDeleteMetric(
  onSuccess?: (deletedId: string) => void,
  onErrorCb?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricResponseDTO, // TData
    Error, // TError
    string, // TVariables (metricId)
    DeleteCtx // TContext
  >({
    mutationFn: deleteMetric,
    // Optimistic delete
    onMutate: async (metricId) => {
      await qc.cancelQueries({
        queryKey: metricsKeys.detailByIdRoot(metricId),
      });

      const details = qc
        .getQueriesData({ queryKey: metricsKeys.detailByIdRoot(metricId) })
        .map(([key, prev]) => {
          qc.setQueryData(key, undefined); // Temp clearing
          return { key, prev };
        });

      return { details };
    },
    onError: (err, _metricId, ctx) => {
      ctx?.details.forEach(({ key, prev }) => {
        qc.setQueryData(key, prev);
      });
      onErrorCb?.(err);
    },
    onSuccess: (_void, metricId) => {
      removeMetricDetail(qc, metricId);
      onSuccess?.(metricId);
    },
    onSettled: async () => {
      await invalidateMetricLists(qc);
    },
  });

  return { deleteMetric: mutateAsync, isError, isSuccess, error, isPending };
}
