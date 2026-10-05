import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { loginUser } from "@/api/auth.api";
import { userAtom } from "@/src/services/state/atoms";
import type { AuthResponseDTO, LoginRequestDTO } from "@/types/dtos/user.dto";

import { setCachedUserProfile } from "../cache";

export function useLoginUserMutation(
  onSuccess?: (response: AuthResponseDTO) => void | Promise<void>,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const setUser = useSetAtom(userAtom);

  const mutation = useMutation<AuthResponseDTO, Error, LoginRequestDTO>({
    // No session handling here. The proxy sets the session cookie on this same
    // response and removes the token from its body (ADR-0025), so a resolved
    // call is a signed-in browser and a rejected one is not.
    mutationFn: loginUser,
    onSuccess: async (response) => {
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
