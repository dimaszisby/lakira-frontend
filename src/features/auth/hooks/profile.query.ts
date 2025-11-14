import { useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useEffect } from "react";

import { fetchUserProfile } from "@/api/auth.api";
import { userAtom } from "@/src/services/state/atoms";

import { authKeys } from "../keys";
import { hasAuthToken } from "../token.storage";

type UseAuthProfileOptions = {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
};

export function useAuthProfileQuery(options: UseAuthProfileOptions = {}) {
  const setUser = useSetAtom(userAtom);
  const enabled = options.enabled ?? hasAuthToken();

  const query = useQuery({
    queryKey: authKeys.profile(),
    queryFn: fetchUserProfile,
    enabled,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    gcTime: options.gcTime ?? 10 * 60 * 1000,
  });

  useEffect(() => {
    if (!query.isSuccess) return;
    setUser(query.data);
  }, [query.data, query.isSuccess, setUser]);

  return query;
}

export const useUserProfile = useAuthProfileQuery;
