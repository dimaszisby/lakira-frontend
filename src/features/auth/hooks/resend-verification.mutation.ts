import { useMutation } from "@tanstack/react-query";

import { resendVerificationEmail } from "../api";

/**
 * Requests a fresh verification email for the signed-in user.
 *
 * The backend rate-limits this (429), so a failure here is often "too soon"
 * rather than a real error — surface its message rather than a generic one.
 */
export const useResendVerificationMutation = () =>
  useMutation({
    mutationFn: () => resendVerificationEmail(),
    retry: false,
  });
