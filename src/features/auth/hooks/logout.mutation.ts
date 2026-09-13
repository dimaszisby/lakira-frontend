import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { logoutUser } from "@/api/auth.api";
import { userAtom } from "@/src/services/state/atoms";

import { removeUserProfile, setCachedUserProfile } from "../cache";

export function useLogoutUserMutation(
  onSuccess?: () => void | Promise<void>,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const setUser = useSetAtom(userAtom);

  const mutation = useMutation<void, Error, void>({
    mutationFn: logoutUser,
    // No `persistSessionToken(null)` here. `/api/auth/logout` clears both the
    // session and the refresh cookie itself, and a second round trip that
    // cleared only one of them is how they last fell out of step.
    onSuccess: async () => {
      setUser(null);
      setCachedUserProfile(qc, null);
      removeUserProfile(qc);
      await onSuccess?.();
    },
    onError,
  });

  const { mutateAsync, isPending, isError, error, isSuccess } = mutation;

  return {
    logoutUser: mutateAsync,
    isPending,
    isError,
    error,
    isSuccess,
  };
}
