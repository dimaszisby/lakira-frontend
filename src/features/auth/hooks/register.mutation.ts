import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { registerUser } from "@/api/auth.api";
import { userAtom } from "@/src/services/state/atoms";
import type { AuthResponseDTO, CreateUserRequestDTO } from "@/types/dtos/user.dto";

import { setCachedUserProfile } from "../cache";
import { persistSessionToken } from "../session.client";

export function useRegisterUserMutation(
  onSuccess?: (response: AuthResponseDTO) => void | Promise<void>,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const setUser = useSetAtom(userAtom);

  const mutation = useMutation<AuthResponseDTO, Error, CreateUserRequestDTO>({
    mutationFn: registerUser,
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
    registerUser: mutateAsync,
    isPending,
    isError,
    error,
    isSuccess,
  };
}
