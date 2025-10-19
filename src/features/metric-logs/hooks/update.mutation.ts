import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { MetricLogResponseDTO, UpdateMetricLogRequestDTO } from "@/types/dtos/metric-log.dto";

import { updateMetricLog } from "../api";
import { invalidateLogDetail, invalidateLogLists, patchLogHeaderOptimistic } from "../cache";
import { metricLogsKeys } from "../keys";
import type { MetricLogVM } from "../view-models";

type UpdateLogVars = {
  logId: string;
  log: UpdateMetricLogRequestDTO;
};

type UpdateCtx = { key: QueryKey; prev?: MetricLogVM };

export function useUpdateMetricLog(
  onSuccess?: (updated: MetricLogResponseDTO) => void,
  onErrorCb?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricLogResponseDTO,
    Error,
    UpdateLogVars,
    UpdateCtx
  >({
    mutationFn: ({ logId, log }) => updateMetricLog({ metricLogId: logId, metricLog: log }),
    onMutate: async ({ logId, log }) => {
      await qc.cancelQueries({
        queryKey: metricLogsKeys.detail(logId),
      });

      const patch: Partial<Pick<MetricLogVM, "logValue" | "loggedAt">> = {
        logValue: log.logValue,
        loggedAt: log.loggedAt,
      };
      return patchLogHeaderOptimistic(qc, logId, patch);
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData<MetricLogVM>(ctx.key, ctx.prev);
      }
      onErrorCb?.(err);
    },
    onSettled: async (_data, _err, vars) => {
      await invalidateLogDetail(qc, vars.logId);
      await invalidateLogLists(qc);
    },

    onSuccess: (updated) => {
      onSuccess?.(updated);
    },
  });

  return {
    updateMetricLog: mutateAsync,
    isError,
    isSuccess,
    error,
    isPending,
  };
}
