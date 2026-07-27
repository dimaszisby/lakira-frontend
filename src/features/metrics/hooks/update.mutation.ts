import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  invalidateMetricDetail,
  invalidateMetricLists,
  patchMetricHeaderOptimistic,
} from "../cache";
import { metricsKeys } from "../keys";
import { updateMetric } from "../metric.api";
import type { MetricResponseDTO, UpdateMetricRequestDTO } from "../metric.dto";
import type { MetricDetailCompositeVM, MetricHeaderVM } from "../view-models";

type Vars = {
  metricId: string;
  metric: UpdateMetricRequestDTO;
};

type Ctx = { key: QueryKey; prev?: MetricDetailCompositeVM };

export function useUpdateMetric(
  onSuccess?: (updated: MetricResponseDTO) => void,
  onErrorCb?: (error: Error) => void,
) {
  const qc = useQueryClient();

  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricResponseDTO,
    Error,
    Vars,
    Ctx
  >({
    mutationFn: (vars) => updateMetric(vars),
    // optimistic patch
    onMutate: async ({ metricId, metric }) => {
      await qc.cancelQueries({
        queryKey: metricsKeys.detailByIdRoot(metricId),
      });

      const patch: Partial<
        Pick<MetricHeaderVM, "name" | "defaultUnit" | "isPublic" | "description">
      > = {
        name: metric.name,
        defaultUnit: metric.defaultUnit,
        isPublic: metric.isPublic,
        description: metric.description,
      };

      return patchMetricHeaderOptimistic(qc, metricId, patch); // return context for rollback
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData<MetricDetailCompositeVM>(ctx.key, ctx.prev);
      }
      onErrorCb?.(err);
    },
    onSettled: async (_data, _err, vars) => {
      await invalidateMetricDetail(qc, vars.metricId);
      await invalidateMetricLists(qc);
    },
    // (Optional) Setup for a success callback for UI toasts
    onSuccess: (updated) => {
      onSuccess?.(updated);
    },
  });

  return { updateMetric: mutateAsync, isError, isSuccess, error, isPending };
}
