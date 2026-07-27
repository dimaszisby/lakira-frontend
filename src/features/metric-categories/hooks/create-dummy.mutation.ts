import { useMutation } from "@tanstack/react-query";

import type {
  GenerateDummyMetricCategoriesRequestDTO,
  MetricCategoryResponseDTO,
} from "@/types/dtos/metric-category.dto";

import { createMetricCategoryDummy } from "../api";

export const useCreateMetricCategoryDummy = (
  onSuccess?: (created: MetricCategoryResponseDTO[]) => void,
  onError?: (error: Error) => void,
) => {
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricCategoryResponseDTO[],
    Error,
    GenerateDummyMetricCategoriesRequestDTO
  >({
    mutationFn: (payload) =>
      createMetricCategoryDummy(payload).then((res) => res.categories ?? []),
    onSuccess,
    onError,
  });

  return {
    createCategoryDummy: mutateAsync,
    onSuccess,
    onError,
    isError,
    isSuccess,
    error,
    isPending,
  };
};
