import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { loginUser } from "@/api/auth.api";
import { establishSession } from "@/features/shared/session.client";
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
    // The session is stored inside the mutation, not in onSuccess: a failed
    // write has to fail the mutation, or the form navigates into the app with
    // no cookie and the first request bounces the user back to /login.
    mutationFn: async (input) => {
      const response = await loginUser(input);
      await establishSession(response.token);
      return response;
    },
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
