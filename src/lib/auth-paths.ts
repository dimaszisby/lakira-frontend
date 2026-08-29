/**
 * Which paths require a session, on both sides of the app.
 *
 * Two separate questions live here because they have different answers:
 *
 * - {@link isProtectedAppPath} — page routes the middleware gates.
 * - {@link isPublicApiPath} — backend paths the proxy may forward without a token.
 *
 * Both were previously inline literals, and the proxy's was an **allowlist of
 * protected segments**, which is a denylist by omission: every backend resource
 * added upstream proxied unauthenticated until someone remembered to add it.
 * `analytics/*` and `admin/_ping` were both exposed that way, and the contract
 * marks both as secured.
 */

/**
 * Top-level page routes that require a session.
 *
 * `middleware.ts` derives its `config.matcher` from this list, so the two can no
 * longer drift. Adding a protected section means adding it here only.
 */
export const PROTECTED_APP_PATHS = [
  "/dashboard",
  "/metrics",
  "/metric-categories",
  "/account",
  "/organization",
] as const;

/** Matcher patterns for `middleware.ts`, derived so they cannot drift. */
export const PROTECTED_APP_MATCHERS = PROTECTED_APP_PATHS.map((path) => `${path}/:path*`);

export const isProtectedAppPath = (pathname: string): boolean =>
  PROTECTED_APP_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

/**
 * Backend paths that may be proxied **without** a session token.
 *
 * Derived from `docs/reference/api/lakira-backend-openapi.json`: every operation
 * declares `security` except these, which are the unauthenticated entry points.
 * Everything else — including `analytics/*` and `admin/_ping` — is secured
 * upstream and now requires a token here too.
 *
 * Matched exactly, not by prefix: `auth/profile` and `auth/switch-org` are
 * secured, so a prefix match on `auth` would wrongly expose them.
 */
export const PUBLIC_API_PATHS = new Set([
  "auth/login",
  "auth/register",
  "auth/logout",
  "auth/refresh",
  "auth/forgot-password",
  "auth/reset-password",
  "auth/verify-email",
]);

/**
 * Does this backend path skip the token requirement?
 *
 * @param segments path segments as received by the proxy, e.g. `["auth", "login"]`
 */
export const isPublicApiPath = (segments: readonly string[]): boolean =>
  PUBLIC_API_PATHS.has(segments.join("/").toLowerCase());
