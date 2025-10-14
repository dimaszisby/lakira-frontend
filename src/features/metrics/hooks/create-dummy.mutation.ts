import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateMetricLists } from "../cache";
import { createMetricDummy } from "../metric.api";

export default function useCreateMetricDummy(
  onSuccess?: () => void,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: createMetricDummy,
    onSuccess: async () => {
      await invalidateMetricLists(qc);
      onSuccess?.();
    },
    onError,
  });

  return {
    createMetricDummy: mutateAsync,
    isError,
    isSuccess,
    error,
    isPending,
  };
}
