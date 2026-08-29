import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useOrganizationId } from "@/features/organizations/context";
import type {
  DisplayOptionsDTO,
  MetricSettingsResponseDTO,
} from "@/types/dtos/metric-settings.dto";

import { updateDisplayOptions } from "../api";
import { invalidateMetricSettingsDetail, invalidateMetricSettingsLists } from "../cache";

export function useUpdateDisplayOptions(
  onSuccess?: (updated: MetricSettingsResponseDTO) => void,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const organizationId = useOrganizationId();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: ({
      id,
      metricId,
      displayOptions,
    }: {
      id: string;
      metricId: string;
      displayOptions: DisplayOptionsDTO;
    }) => updateDisplayOptions(id, metricId, displayOptions),
    onSuccess: async (updated) => {
      await invalidateMetricSettingsDetail(qc, organizationId, updated.id);
      await invalidateMetricSettingsLists(qc, organizationId);
      onSuccess?.(updated);
    },
    onError,
  });

  return {
    updateDisplayOptions: mutateAsync,
    onSuccess,
    onError,
    isError,
    isSuccess,
    error,
    isPending,
  };
}
