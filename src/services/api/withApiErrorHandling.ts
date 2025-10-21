// Used on API calls throughout the app to provide consistent error handling
import { handleApiError } from "@/src/services/api/handleApiError";

import { isAbortError, toAbortDomException } from "./isAbortError";

export const withApiErrorHandling = async <T>(
  fn: () => Promise<T>,
  functionName: string,
): Promise<T> => {
  try {
    return await fn();
  } catch (error: unknown) {
    // Treat cancels as non-errors and do NOT log them
    if (isAbortError(error)) throw toAbortDomException(); // Normalize for React-Query treats it as a cancelled fetch

    // log errors outside prod
    if (process.env.NODE_ENV !== "production") {
      console.error(`[API ERROR] ${functionName}:`, error);
    }

    // Centralized handling/telemetry
    handleApiError(error);

    // preserve error for callers if they need it
    throw error;
  }
};
