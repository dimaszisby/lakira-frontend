import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useOrganizationId } from "@/features/organizations/context";
import type { MetricSettingsResponseDTO } from "@/types/dtos/metric-settings.dto";

import { deleteMetricSettings } from "../api";
import { invalidateMetricSettingsLists, removeMetricSettingsDetail } from "../cache";
import { metricSettingsKeys } from "../keys";

type DeleteCtx = {
  // Temp snapshot all detail variants for restoration
  details: Array<{ key: QueryKey; prev: unknown }>;
};

export function useDeleteMetricSettings(
  onSuccess?: (deletedId: string) => void,
  onErrorCb?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const organizationId = useOrganizationId();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricSettingsResponseDTO,
    Error,
    { id: string; metricId: string },
    DeleteCtx
  >({
    mutationFn: ({ id, metricId }) => deleteMetricSettings(id, metricId),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({
        queryKey: metricSettingsKeys.detail(organizationId, id),
      });

      const details = qc
        .getQueriesData({ queryKey: metricSettingsKeys.detailByIdRoot(organizationId, id) })
        .map(([key, prev]) => {
          qc.setQueryData(key, undefined); // Temp clearing
          return { key, prev };
        });

      return { details };
    },
    onError: (err, _vars, ctx) => {
      ctx?.details.forEach(({ key, prev }) => {
        qc.setQueryData(key, prev);
      });
      onErrorCb?.(err);
    },
    onSuccess: (_void, vars) => {
      removeMetricSettingsDetail(qc, organizationId, vars.id);
      onSuccess?.(vars.id);
    },
    onSettled: async () => {
      await invalidateMetricSettingsLists(qc, organizationId);
    },
  });

  return {
    deleteMetricSettings: mutateAsync,
    onSuccess,
    isError,
    isSuccess,
    error,
    isPending,
  };
}
