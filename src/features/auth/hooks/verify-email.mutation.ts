import { useMutation } from "@tanstack/react-query";

import { verifyEmail } from "../api";

/**
 * Confirms an email address using the token from a verification link.
 *
 * Deliberately not a query: this is a one-shot side effect, and a query would
 * retry it on refetch, burning a single-use token.
 */
export const useVerifyEmailMutation = () =>
  useMutation({
    mutationFn: (token: string) => verifyEmail(token),
    retry: false,
  });
