import api from "@/services/api/api";
import { withApiErrorHandling } from "@/services/api/withApiErrorHandling";
import type ApiResponse from "@/types/generics/ApiResponse";
import { unwrap } from "@/types/generics/ApiResponse";
import type { RequestOpts } from "@/types/generics/RequestOpts";

/**
 * Account-lifecycle calls: email verification and password reset.
 *
 * Login, register and logout still live in `src/services/api/auth.api.ts`,
 * which predates the feature-module convention and uses raw try/catch with
 * `console.error`. `.claude/rules/data-access.md` marks it legacy and says not
 * to copy it, so these follow the convention instead:
 * `withApiErrorHandling` + `unwrap`.
 */

type Acknowledgement = { message?: string };

/**
 * Confirm an email address with the token from a verification link.
 *
 * Unauthenticated: the user clicks this from their inbox, usually in a browser
 * with no session.
 */
export const verifyEmail = (token: string, opts?: RequestOpts) =>
  withApiErrorHandling(
    () =>
      api.post<ApiResponse<Acknowledgement>>("/auth/verify-email", { token }, opts).then(unwrap),
    "verifyEmail",
  );

/**
 * Ask for a new verification email.
 *
 * Requires a session — the backend resolves the address from the token rather
 * than accepting one, so this cannot be used to spray mail at arbitrary
 * addresses.
 */
export const resendVerificationEmail = (opts?: RequestOpts) =>
  withApiErrorHandling(
    () =>
      api
        .post<ApiResponse<Acknowledgement>>("/auth/resend-verification", undefined, opts)
        .then(unwrap),
    "resendVerificationEmail",
  );

/**
 * Start a password reset.
 *
 * The backend answers identically whether or not the address exists, so the
 * response must never be used to tell the user which case they are in — that
 * would turn this into an account-enumeration oracle.
 */
export const requestPasswordReset = (email: string, opts?: RequestOpts) =>
  withApiErrorHandling(
    () =>
      api.post<ApiResponse<Acknowledgement>>("/auth/forgot-password", { email }, opts).then(unwrap),
    "requestPasswordReset",
  );

export type ResetPasswordInput = {
  token: string;
  password: string;
  passwordConfirmation: string;
};

/** Complete a password reset with the token from the emailed link. */
export const resetPassword = (input: ResetPasswordInput, opts?: RequestOpts) =>
  withApiErrorHandling(
    () => api.post<ApiResponse<Acknowledgement>>("/auth/reset-password", input, opts).then(unwrap),
    "resetPassword",
  );
