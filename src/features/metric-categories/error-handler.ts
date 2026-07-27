import { handleApiError } from "@/services/api/handleApiError";

export const handleMetricCategoryApiError = (error: unknown) => {
  return handleApiError(error as Error);
};
