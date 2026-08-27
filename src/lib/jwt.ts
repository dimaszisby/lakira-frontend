/**
 * Minimal JWT payload reader for the edge session gate.
 *
 * ## This does not verify anything
 *
 * The signature is **not** checked, and it must not be — verification needs the
 * signing secret, which is the backend's and has no business in a frontend
 * bundle or an edge runtime. Every real authorization decision is the backend's,
 * enforced when the proxy forwards the bearer token.
 *
 * What this buys is a cheap liveness check at the edge. Previously
 * `middleware.ts` tested only that a cookie *existed*, so an expired or
 * malformed token sailed through the gate and failed later as an opaque API
 * error instead of a clean redirect to the login page.
 *
 * Treating an unreadable token as expired is the safe direction: the worst case
 * is an unnecessary redirect to a login page that re-authenticates.
 *
 * No dependency is used. `jose` would verify signatures we deliberately do not
 * check, and `jwt-decode` is a few lines of base64url handling.
 */

export type JwtPayload = {
  /** Expiry, seconds since the epoch. */
  exp?: number;
  /** Issued-at, seconds since the epoch. */
  iat?: number;
  sub?: string;
  [claim: string]: unknown;
};

/**
 * Decode base64url. `atob` is available in the Edge runtime, Node 16+, and the
 * browser; `Buffer` is not available on the edge.
 */
const decodeBase64Url = (segment: string): string | null => {
  try {
    const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
    const suffix = "=".repeat((4 - (padded.length % 4)) % 4);
    return atob(padded + suffix);
  } catch {
    return null;
  }
};

/** Read a JWT's payload without verifying it. Returns `null` if unreadable. */
export const decodeJwtPayload = (token: string): JwtPayload | null => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const json = decodeBase64Url(parts[1]);
  if (json === null) return null;

  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    return parsed as JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Is this token expired, unreadable, or missing an `exp` claim?
 *
 * A token with no `exp` is treated as expired: a session cookie that never
 * expires is not something to trust by default.
 *
 * @param leewaySeconds clock-skew allowance. Defaults to 0; the gate is
 *   advisory and the backend re-checks, so there is no need to be generous.
 */
export const isJwtExpired = (token: string, leewaySeconds = 0): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
    return true;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp + leewaySeconds <= nowSeconds;
};

/** Convenience inverse of {@link isJwtExpired} for readability at call sites. */
export const isSessionTokenUsable = (token: string | undefined | null): token is string =>
  typeof token === "string" && token.length > 0 && !isJwtExpired(token);
