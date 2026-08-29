import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateMetricVisualization } from "@/features/data-visualizations/cache";
import { useOrganizationId } from "@/features/organizations/context";
import type { MetricLogResponseDTO } from "@/types/dtos/metric-log.dto";

import { deleteMetricLog } from "../api";
import { invalidateLogLists, removeLogDetail } from "../cache";
import { metricLogsKeys } from "../keys";

type DeleteCtx = {
  // Temp snapshot all detail variants for restoration
  details: Array<{ key: QueryKey; prev: unknown }>;
};

type DeleteVars = {
  logId: string;
  metricId: string;
};

export function useDeleteMetricLog(onSuccess?: (deletedId: string) => void, onErrorCb?: (error: Error) => void) {
  const qc = useQueryClient();
  const organizationId = useOrganizationId();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricLogResponseDTO,
    Error,
    DeleteVars,
    DeleteCtx
  >({
    mutationFn: ({ logId }) => deleteMetricLog(logId),
    onMutate: async ({ logId }) => {
      await qc.cancelQueries({
        queryKey: metricLogsKeys.detail(organizationId, logId),
      });

      const details = qc
        .getQueriesData({ queryKey: metricLogsKeys.detailByIdRoot(organizationId, logId) })
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
    onSuccess: (_void, { logId }) => {
      removeLogDetail(qc, organizationId, logId);
      onSuccess?.(logId);
    },
    onSettled: async (_data, _err, vars) => {
      await invalidateLogLists(qc, organizationId);
      await invalidateMetricVisualization(qc, organizationId, vars.metricId);
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
