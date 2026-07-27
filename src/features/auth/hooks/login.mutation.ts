import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { loginUser } from "@/api/auth.api";
import { userAtom } from "@/src/services/state/atoms";
import type { AuthResponseDTO, LoginRequestDTO } from "@/types/dtos/user.dto";

import { setCachedUserProfile } from "../cache";
import { persistSessionToken } from "../session.client";

export function useLoginUserMutation(
  onSuccess?: (response: AuthResponseDTO) => void | Promise<void>,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const setUser = useSetAtom(userAtom);

  const mutation = useMutation<AuthResponseDTO, Error, LoginRequestDTO>({
    mutationFn: loginUser,
    onSuccess: async (response) => {
      await persistSessionToken(response.token ?? null);

      if (response.user) {
        setUser(response.user);
        setCachedUserProfile(qc, response.user);
      } else {
        setUser(null);
        setCachedUserProfile(qc, null);
      }

      await onSuccess?.(response);
    },
    onError,
  });

  const { mutateAsync, isPending, isError, error, isSuccess } = mutation;

  return {
    loginUser: mutateAsync,
    isPending,
    isError,
    error,
    isSuccess,
  };
}
