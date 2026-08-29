import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useOrganizationId } from "@/features/organizations/context";
import type { MetricSettingsResponseDTO } from "@/types/dtos/metric-settings.dto";

import { updateGoalAchievement } from "../api";
import { invalidateMetricSettingsDetail, invalidateMetricSettingsLists } from "../cache";

export function useUpdateGoalAchievement(
  onSuccess?: (updated: MetricSettingsResponseDTO) => void,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const organizationId = useOrganizationId();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: ({ id, metricId }: { id: string; metricId: string }) =>
      updateGoalAchievement(id, metricId),
    onSuccess: async (updated) => {
      await invalidateMetricSettingsDetail(qc, organizationId, updated.id);
      await invalidateMetricSettingsLists(qc, organizationId);
      onSuccess?.(updated);
    },
    onError,
  });

  return {
    updateGoalAchievement: mutateAsync,
    onSuccess,
    onError,
    isError,
    isSuccess,
    error,
    isPending,
  };
}
