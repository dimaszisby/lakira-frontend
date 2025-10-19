import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { MetricLogResponseDTO } from "@/types/dtos/metric-log.dto";

import { deleteMetricLog } from "../api";
import { invalidateLogLists, removeLogDetail } from "../cache";
import { metricLogsKeys } from "../keys";

type DeleteCtx = {
  // Temp snapshot all detail variants for restoration
  details: Array<{ key: QueryKey; prev: unknown }>;
};

export function useDeleteMetricLog(
  onSuccess?: (deletedId: string) => void,
  onErrorCb?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricLogResponseDTO,
    Error,
    string,
    DeleteCtx
  >({
    mutationFn: deleteMetricLog,
    onMutate: async (logId) => {
      await qc.cancelQueries({
        queryKey: metricLogsKeys.detail(logId),
      });

      const details = qc
        .getQueriesData({ queryKey: metricLogsKeys.detailByIdRoot(logId) })
        .map(([key, prev]) => {
          qc.setQueryData(key, undefined); // Temp clearing
          return { key, prev };
        });

      return { details };
    },
    onError: (err, _logId, ctx) => {
      ctx?.details.forEach(({ key, prev }) => {
        qc.setQueryData(key, prev);
      });
      onErrorCb?.(err);
    },
    onSuccess: (_void, logId) => {
      removeLogDetail(qc, logId);
      onSuccess?.(logId);
    },
    onSettled: async () => {
      await invalidateLogLists(qc);
    },
  });

  return {
    deleteMetricLog: mutateAsync,
    isError,
    isSuccess,
    error,
    isPending,
  };
}
