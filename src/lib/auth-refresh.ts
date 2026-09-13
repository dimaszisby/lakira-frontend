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

/** The single un-coalesced round trip. Only {@link refreshAccessToken} calls it. */
const performRefresh = async (refreshToken: string): Promise<RefreshResult | null> => {
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

/**
 * ## Why refreshing is coalesced
 *
 * Redeeming a refresh token rotates it, and the backend treats a *second*
 * presentation of an already-redeemed token as replay: it revokes the entire
 * token family and the session is gone (`RotateRefreshToken`, reason `"reuse"`).
 * That is the correct behaviour for a stolen token, and a trap for an honest
 * client.
 *
 * An app page fires several queries at once. When the 15-minute access token
 * expires they all return 401 together, so without coalescing every one of them
 * redeems the same cookie: the first rotates, and each of the rest is read as
 * replay. The user is logged out *because* refresh works. Two windows are
 * therefore held shut:
 *
 * - **In flight.** Callers arriving while a refresh is running await that one
 *   promise instead of starting their own.
 * - **Just finished.** A request that left the browser before the rotated
 *   cookie arrived still carries the old value. For {@link RESULT_GRACE_MS}
 *   after a refresh settles, that old value replays the recorded result rather
 *   than redeeming again.
 *
 * ## What this does not cover
 *
 * The state is per process. Several server instances behind a load balancer
 * each keep their own map, so a burst split across instances can still collide.
 * Closing that needs shared state (Redis) or a backend that tolerates a short
 * reuse window; neither belongs in this change. Within one instance — which is
 * `next dev` and a single container — the race is closed.
 */

/** How long a settled refresh answers for the token that produced it. */
const RESULT_GRACE_MS = 30_000;

/** Upper bound on remembered results, so a hostile caller cannot grow the map. */
const MAX_REMEMBERED = 100;

const inFlight = new Map<string, Promise<RefreshResult | null>>();
const settled = new Map<string, { result: RefreshResult | null; at: number }>();

const forgetStale = (now: number): void => {
  for (const [key, entry] of settled) {
    if (now - entry.at >= RESULT_GRACE_MS) settled.delete(key);
  }
  // Insertion order, so the oldest go first.
  while (settled.size > MAX_REMEMBERED) {
    const oldest = settled.keys().next();
    if (oldest.done) break;
    settled.delete(oldest.value);
  }
};

/**
 * Exchange a refresh token for a new access token, at most once per token.
 *
 * Returns `null` when the refresh token is missing, rejected, or the backend is
 * unreachable — every one of which means "cannot refresh", and the caller
 * should fall through to its unauthenticated path rather than retrying.
 *
 * Concurrent and near-simultaneous callers presenting the same token share one
 * round trip; see the note above for why that is a correctness requirement and
 * not an optimisation.
 */
export const refreshAccessToken = async (
  refreshToken: string | undefined | null,
): Promise<RefreshResult | null> => {
  if (!refreshToken) return null;

  const now = Date.now();
  forgetStale(now);

  const recent = settled.get(refreshToken);
  if (recent) return recent.result;

  const pending = inFlight.get(refreshToken);
  if (pending) return pending;

  const attempt = performRefresh(refreshToken).finally(() => {
    inFlight.delete(refreshToken);
  });

  // Recorded before the await so a caller arriving mid-flight finds it.
  inFlight.set(refreshToken, attempt);

  const result = await attempt;
  settled.set(refreshToken, { result, at: Date.now() });
  return result;
};

/**
 * Drop all coalescing state. Tests only — each case needs a clean slate, and
 * without this a token value reused across cases would replay the first answer.
 */
export const resetRefreshCoalescing = (): void => {
  inFlight.clear();
  settled.clear();
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
 * Clear both session cookies.
 *
 * Every attribute the setter used has to be repeated. A clear that omits one
 * does not match the stored cookie, so the browser keeps it and a "logged out"
 * session stays live — which is the shape of the logout bug this replaces.
 *
 * Both cookies go together, always. Clearing the access token alone leaves a
 * refresh cookie that can mint a new one, and clearing the refresh token alone
 * leaves an access token good for up to fifteen minutes.
 */
export const clearSessionCookies = (cookies: CookieWriter): void => {
  cookies.set(SESSION_COOKIE_NAME, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    path: REFRESH_COOKIE_PATH,
    maxAge: 0,
  });
};

/**
 * Capture the refresh cookie the backend issued on login or registration, so it
 * is stored against this origin rather than the backend's path.
 */
export const captureRefreshCookie = (headers: Headers): string | null =>
  readSetCookie(headers, REFRESH_COOKIE_NAME);
