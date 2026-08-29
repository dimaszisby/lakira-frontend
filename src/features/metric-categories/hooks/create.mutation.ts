import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useOrganizationId } from "@/features/organizations/context";
import type {
  CreateMetricCategoryRequestDTO,
  MetricCategoryResponseDTO,
} from "@/types/dtos/metric-category.dto";

import { createMetricCategory } from "../api";
import { invalidateMetricCategoryLists } from "../cache";

export const useCreateMetricCategory = (
  onSuccess?: (created: MetricCategoryResponseDTO) => void,
  onError?: (error: Error) => void,
) => {
  const qc = useQueryClient();
  const organizationId = useOrganizationId();

  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricCategoryResponseDTO,
    Error,
    CreateMetricCategoryRequestDTO
  >({
    mutationFn: (category) => createMetricCategory(category),
    onSuccess: async (created) => {
      await invalidateMetricCategoryLists(qc, organizationId);
      onSuccess?.(created);
    },
    onError,
  });

  return {
    createMetricCategory: mutateAsync,
    onSuccess,
    onError,
    isError,
    isSuccess,
    error,
    isPending,
  };
};
