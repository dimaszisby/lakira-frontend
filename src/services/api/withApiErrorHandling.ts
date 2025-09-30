import { handleApiError } from "@/src/services/api/handleApiError";
import { isAbortError, toAbortDomException } from "./isAbortError";

export const withApiErrorHandling = async <T>(
  fn: () => Promise<T>,
  functionName: string
): Promise<T> => {
  try {
    return await fn();
  } catch (error: unknown) {
    console.error(`Error in ${functionName}:`, error);
    if (isAbortError(error)) throw toAbortDomException();
    handleApiError(error);
    throw error;
  }
};
