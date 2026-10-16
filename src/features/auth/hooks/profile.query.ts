import { useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useEffect } from "react";

import { fetchUserProfile } from "@/api/auth.api";
import { httpStatusFrom } from "@/services/api/http-status";
import { userAtom } from "@/src/services/state/atoms";

import { authKeys } from "../keys";

type UseAuthProfileOptions = {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
};

/**
 * A 4xx other than 429 will not change on a retry, so the account page shows
 * it at once instead of after TanStack's three backed-off attempts. Same rule
 * as the metrics list queries. Kit `profile-load-errors`, D-01.
 */
export const shouldRetryProfile = (failureCount: number, error: unknown): boolean => {
  const status = httpStatusFrom(error);
  if (status && status < 500 && status !== 429) return false;
  return failureCount < 2;
};

export function useAuthProfileQuery(options: UseAuthProfileOptions = {}) {
  const setUser = useSetAtom(userAtom);
  const enabled = options.enabled ?? true;

  const query = useQuery({
    queryKey: authKeys.profile(),
    queryFn: fetchUserProfile,
    enabled,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    gcTime: options.gcTime ?? 10 * 60 * 1000,
    retry: shouldRetryProfile,
  });

  useEffect(() => {
    if (!query.isSuccess) return;
    setUser(query.data);
  }, [query.data, query.isSuccess, setUser]);

  return query;
}

export const useUserProfile = useAuthProfileQuery;
