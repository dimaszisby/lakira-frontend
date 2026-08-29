import { useMutation } from "@tanstack/react-query";

import type {ResetPasswordInput} from "../api";
import { resetPassword } from "../api";

/** Completes a password reset with the token from the emailed link. */
export const useResetPasswordMutation = () =>
  useMutation({
    mutationFn: (input: ResetPasswordInput) => resetPassword(input),
    retry: false,
  });
