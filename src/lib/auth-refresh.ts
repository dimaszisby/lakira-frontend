import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
} from "@/constants/app";
import { getApiBaseUrl } from "@/lib/env";
import { decodeJwtPayload } from "@/lib/jwt";
import { logger } from "@/lib/logger";

/**
 * Server-side access-token refresh. Shared by the proxy and `/api/auth/*`.
 *
 * ## Why this exists
 *
 * The backend issues 15-minute access tokens. Without refresh, a session stops
 * working a quarter of an hour after login — as unhandled 401s before the
 * middleware checked expiry, and as a bounce to `/login` after. Refresh is what
 * makes a session last.
 *
 * ## The cookie-path problem
 *
 * The backend sets its refresh cookie with `Path=/api/v1/auth/refresh`, which
 * is a path on *its* origin. Forwarded to the browser verbatim, that stores a
 * cookie scoped to a path this app does not serve, so the browser would never
 * send it back and refresh would fail on the second attempt. Every function
 * here re-scopes the cookie to {@link REFRESH_COOKIE_PATH}.
 *
 * ## Rotation
 *
 * The backend rotates the refresh token on every use and revokes the whole
 * family if an already-used one is presented (verified against a live backend:
 * replaying a rotated cookie returns "Unauthorized: Invalid refresh token").
 * So the new cookie must be persisted on every refresh — dropping it logs the
 * user out at the next attempt.
 */

export type RefreshResult = {
  /** The freshly issued access token. */
  token: string;
  /** New refresh-token value to persist, when the backend rotated one. */
  refreshToken: string | null;
};

/** Pull a cookie value out of a `Set-Cookie` header list. */
const readSetCookie = (headers: Headers, name: string): string | null => {
  const raw = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  for (const cookie of raw) {
    const [pair] = cookie.split(";");
    const separator = pair.indexOf("=");
    if (separator > 0 && pair.slice(0, separator).trim() === name) {
      return pair.slice(separator + 1).trim();
    }
  }
  return null;
};

/**
 * Exchange a refresh token for a new access token.
 *
 * Returns `null` when the refresh token is missing, rejected, or the backend is
 * unreachable — every one of which means "cannot refresh", and the caller
 * should fall through to its unauthenticated path rather than retrying.
 */
export const refreshAccessToken = async (
  refreshToken: string | undefined | null,
): Promise<RefreshResult | null> => {
  if (!refreshToken) return null;

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { cookie: `${REFRESH_COOKIE_NAME}=${refreshToken}` },
      cache: "no-store",
    });
  } catch (error) {
    logger.warn("auth.refresh.unreachable", { error });
    return null;
  }

  if (!response.ok) {
    // A 401 here is normal and expected: the refresh token expired, or was
    // already redeemed and the family revoked. Not an error worth alarming on.
    logger.info("auth.refresh.rejected", { status: response.status });
    return null;
  }

  const body = (await response.json().catch(() => null)) as { data?: { token?: unknown } } | null;
  const token = body?.data?.token;

  if (typeof token !== "string" || decodeJwtPayload(token) === null) {
    logger.error("auth.refresh.malformed", { hasToken: typeof token });
    return null;
  }

  return { token, refreshToken: readSetCookie(response.headers, REFRESH_COOKIE_NAME) };
};

type CookieWriter = {
  set: (name: string, value: string, options: Record<string, unknown>) => unknown;
};

/**
 * Write a refreshed session onto a response.
 *
 * Re-scopes the refresh cookie to this origin. `sameSite: "strict"` matches the
 * backend's own choice and is safe here because the cookie is only ever
 * redeemed by a same-site request to `/api/auth/*`.
 */
export const applyRefreshedSession = (cookies: CookieWriter, result: RefreshResult): void => {
  cookies.set(SESSION_COOKIE_NAME, result.token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  if (result.refreshToken) {
    cookies.set(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_MAX_AGE_SECONDS,
    });
  }
};

/**
 * Capture the refresh cookie the backend issued on login or registration, so it
 * is stored against this origin rather than the backend's path.
 */
export const captureRefreshCookie = (headers: Headers): string | null =>
  readSetCookie(headers, REFRESH_COOKIE_NAME);
