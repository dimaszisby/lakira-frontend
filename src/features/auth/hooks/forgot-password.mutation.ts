import { useMutation } from "@tanstack/react-query";

import { requestPasswordReset } from "../api";

/**
 * Starts a password reset.
 *
 * The backend answers identically whether or not the address exists. Callers
 * must show the same confirmation either way — branching on the result would
 * turn this into an account-enumeration oracle.
 */
export const useForgotPasswordMutation = () =>
  useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
    retry: false,
  });
