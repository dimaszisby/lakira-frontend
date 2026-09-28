import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { registerUser } from "@/api/auth.api";
import { establishSession } from "@/features/shared/session.client";
import { userAtom } from "@/src/services/state/atoms";
import type { AuthResponseDTO, CreateUserRequestDTO } from "@/types/dtos/user.dto";

import { setCachedUserProfile } from "../cache";

export function useRegisterUserMutation(
  onSuccess?: (response: AuthResponseDTO) => void | Promise<void>,
  onError?: (error: Error) => void,
) {
  const qc = useQueryClient();
  const setUser = useSetAtom(userAtom);

  const mutation = useMutation<AuthResponseDTO, Error, CreateUserRequestDTO>({
    // The session is stored inside the mutation, not in onSuccess: a failed
    // write has to fail the mutation, or the form navigates into the app with
    // no cookie and the first request bounces the user back to /login.
    mutationFn: async (input) => {
      const response = await registerUser(input);
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
    registerUser: mutateAsync,
    isPending,
    isError,
    error,
    isSuccess,
  };
}
