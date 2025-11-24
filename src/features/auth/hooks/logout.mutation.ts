import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { logoutUser } from "@/api/auth.api";
import { userAtom } from "@/src/services/state/atoms";
import type ApiResponse from "@/types/generics/ApiResponse";

import { removeUserProfile, setCachedUserProfile } from "../cache";
import { persistSessionToken } from "../session.client";
import { clearAuthToken } from "../token.storage";

type LogoutResponse = ApiResponse<{ message: string }>;

export function useLogoutUserMutation(
  onSuccess?: (response: LogoutResponse) => void | Promise<void>,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const setUser = useSetAtom(userAtom);

  const mutation = useMutation<LogoutResponse, Error, void>({
    mutationFn: logoutUser,
    onSuccess: async (response) => {
      clearAuthToken();
      await persistSessionToken(null);
      setUser(null);
      setCachedUserProfile(qc, null);
      removeUserProfile(qc);
      await onSuccess?.(response);
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
