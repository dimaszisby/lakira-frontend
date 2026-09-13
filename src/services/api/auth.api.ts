import type { AuthResponseDTO, CreateUserRequestDTO, LoginRequestDTO } from "@/types/dtos/user.dto";
import type ApiResponse from "@/types/generics/ApiResponse";
import { unwrap, unwrapOrNull } from "@/types/generics/ApiResponse";

import type { UserAtom } from "../state/atoms.js";
import api from "./api";
import { withApiErrorHandling } from "./withApiErrorHandling";

/** Same-origin session route, not a backend path. */
const LOGOUT_ENDPOINT = "/api/auth/logout";

/**
 * Auth calls.
 *
 * ## Why these rethrow rather than flatten
 *
 * `registerUser` and `loginUser` used to catch the Axios error and rethrow
 * `new Error(handleApiError(error).join(", "))`. That discarded the response:
 * the replacement is a plain `Error` carrying only a string, with no `status`.
 *
 * The forms then called `handleApiError` a *second* time on that plain Error,
 * and `normalizeApiError` fell through to its non-Axios branch with
 * `status: undefined` — which `friendlyMessageFor` renders as "We couldn't
 * reach the server. Check your connection and try again."
 *
 * So every auth failure read as a network problem. A wrong password, a 429 from
 * the rate limiter, a 500 — all three told the user to check their connection,
 * and the correct message the first call had already produced was thrown away.
 * Seen on 2026-09-13 against a rate-limited local backend: the browser logged
 * `status: 429` while the form showed the connection error.
 *
 * `withApiErrorHandling` logs and reports, then rethrows the **original** error,
 * so the one `handleApiError` call at the point of display sees a real
 * `AxiosError` and maps the status. This is what every other feature `api.ts`
 * already does.
 */

export const registerUser = (userData: CreateUserRequestDTO): Promise<AuthResponseDTO> =>
  withApiErrorHandling(
    () => api.post<ApiResponse<AuthResponseDTO>>("/auth/register", userData).then(unwrap),
    "registerUser",
  );

export const loginUser = (credentials: LoginRequestDTO): Promise<AuthResponseDTO> =>
  withApiErrorHandling(
    () => api.post<ApiResponse<AuthResponseDTO>>("/auth/login", credentials).then(unwrap),
    "loginUser",
  );

/**
 * Fetches the profile of the logged-in user.
 *
 * Returns `null` on failure rather than throwing — callers treat "no profile"
 * and "could not load the profile" alike, and an unauthenticated read here is
 * routine rather than exceptional.
 */
export const fetchUserProfile = async (): Promise<UserAtom | null> => {
  try {
    const response = await api.get<ApiResponse<UserAtom>>("/auth/profile");
    return unwrapOrNull(response);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[API ERROR] fetchUserProfile:", error);
    }
    return null;
  }
};

/**
 * Logs out the user.
 *
 * Deliberately *not* an `api` (proxy) call. Going through `/api/proxy` revoked
 * the refresh family upstream and left both cookies on this origin untouched —
 * the proxy strips `Set-Cookie`, and the route that deletes them was never
 * reached. `/api/auth/logout` does the upstream revocation and the local clear
 * together, which is the only combination that actually ends a session.
 */
export const logoutUser = async (): Promise<void> => {
  const response = await fetch(LOGOUT_ENDPOINT, { method: "POST" });

  if (!response.ok) {
    throw new Error("Logout failed");
  }
};
