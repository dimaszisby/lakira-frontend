import { useMutation } from "@tanstack/react-query";

import { createMetricCategoryDummy } from "../api";

export const useCreateMetricCategoryDummy = (
  onSuccess?: () => void,
  onError?: (error: Error) => void,
) => {
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: createMetricCategoryDummy,
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
