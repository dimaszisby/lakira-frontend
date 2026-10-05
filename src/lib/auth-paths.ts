/**
 * Which paths require a session, on both sides of the app, and which backend
 * paths the proxy will forward at all.
 *
 * Three separate questions live here because they have different answers:
 *
 * - {@link isProtectedAppPath} — page routes the middleware gates.
 * - {@link isPublicApiPath} — backend paths the proxy may forward without a token.
 * - {@link buildUpstreamUrl} — where a proxied request goes, or that it goes nowhere.
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
 * `src/proxy.ts` derives its `config.matcher` from this list, so the two can no
 * longer drift. Adding a protected section means adding it here only.
 */
export const PROTECTED_APP_PATHS = [
  "/dashboard",
  "/metrics",
  "/metric-categories",
  "/account",
  "/organization",
] as const;

/** Matcher patterns for `src/proxy.ts`, derived so they cannot drift. */
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
 * Backend operations whose success response carries an access token in its body.
 *
 * The proxy stores that token as the session cookie and removes it from what
 * the browser receives, so no client code ever holds it (ADR-0025). This list
 * has to be complete: `src/lib/__tests__/auth-paths.test.ts` walks the OpenAPI
 * contract and fails if an operation that returns a `token` is missing here.
 *
 * All four are `POST`. Matched exactly, like {@link PUBLIC_API_PATHS}.
 */
export const TOKEN_ISSUING_API_PATHS = new Set([
  "auth/login",
  "auth/register",
  "auth/switch-org",
  "auth/refresh",
]);

/** Does a successful `POST` to this backend path return an access token? */
export const isTokenIssuingApiPath = (segments: readonly string[]): boolean =>
  TOKEN_ISSUING_API_PATHS.has(segments.join("/").toLowerCase());

/**
 * Does this backend path skip the token requirement?
 *
 * @param segments path segments as received by the proxy, e.g. `["auth", "login"]`
 */
export const isPublicApiPath = (segments: readonly string[]): boolean =>
  PUBLIC_API_PATHS.has(segments.join("/").toLowerCase());

/** Characters that would let one route segment span more than one path component. */
const PATH_SEPARATOR = /[/\\]/;

/**
 * The backend URL for a proxied request, or `null` when the path must not be
 * forwarded.
 *
 * Next decodes each route segment before the handler sees it, so
 * `/api/proxy/..%2f..%2fhealth` arrives as the single segment `../../health`.
 * Joined raw into a URL, that climbed out of the API base to any path on the
 * backend's origin (audit 2026-10-04, N1). A decoded `?` or `#` was
 * re-interpreted the same way.
 *
 * So a segment is treated as one opaque path component. Anything that could
 * span components is refused, the rest is percent-encoded, and the result is
 * checked against the base as a backstop for a case these rules miss.
 *
 * @param apiBaseUrl the configured API base, e.g. `http://localhost:8001/api/v1`
 * @param segments path segments as received by the proxy, e.g. `["metrics", "42"]`
 */
export const buildUpstreamUrl = (apiBaseUrl: string, segments: readonly string[]): URL | null => {
  const isOpaque = (segment: string): boolean =>
    segment !== "" && segment !== "." && segment !== ".." && !PATH_SEPARATOR.test(segment);

  if (!segments.every(isOpaque)) return null;

  const base = new URL(apiBaseUrl);
  const basePath = base.pathname.replace(/\/$/, "");

  let encoded: string;
  try {
    encoded = segments.map(encodeURIComponent).join("/");
  } catch {
    // `encodeURIComponent` throws on a lone surrogate. Not a path worth a 500.
    return null;
  }

  const target = new URL(`${base.origin}${basePath}/${encoded}`);

  const isUnderBase = target.origin === base.origin && target.pathname.startsWith(`${basePath}/`);
  return isUnderBase ? target : null;
};
