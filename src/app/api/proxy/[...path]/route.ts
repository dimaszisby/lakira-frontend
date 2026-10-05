import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
} from "@/constants/app";
import { buildUpstreamUrl, isPublicApiPath } from "@/lib/auth-paths";
import {
  applyRefreshedSession,
  captureRefreshCookie,
  clearSessionCookies,
  refreshAccessToken,
} from "@/lib/auth-refresh";
import { getApiBaseUrl } from "@/lib/env";
import { logger } from "@/lib/logger";

const FORWARDED_HEADER_BLOCKLIST = new Set(["connection", "content-length", "host"]);

/**
 * The body this proxy returns for the two 401s it issues on its own behalf:
 * no session cookie at all, and a cookie whose refresh could not rescue it.
 *
 * The `code` is what lets the UI tell those apart from an endpoint's own 401 —
 * a wrong password is also a 401, and `handleApiError` used to render both as
 * "Your session expired", telling users to log in on the login page. Status
 * alone cannot carry the difference; only this proxy knows it.
 */
const SESSION_EXPIRED_BODY = { error: "Session expired", code: "SESSION_EXPIRED" } as const;

/** Returned when the request to the backend fails outright, before any response. */
const UPSTREAM_UNREACHABLE_BODY = { error: "The server could not be reached." } as const;

/** Returned for a path that could reach outside the API base. Nothing is forwarded. */
const INVALID_PATH_BODY = { error: "Invalid path" } as const;

/** Long enough to recognise a probe in the log, short enough not to be a payload. */
const MAX_LOGGED_PATH_LENGTH = 200;

/** The header `lakira-backend` sets on every response and tags its own errors with. */
const REQUEST_ID_HEADER = "x-request-id";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function proxyHandler(request: NextRequest, context: RouteContext) {
  // Resolved per request, not at module load: `next build` evaluates route
  // modules with no environment, and getApiBaseUrl() throws in production when
  // nothing is configured.
  let apiBaseUrl: string;
  try {
    apiBaseUrl = getApiBaseUrl();
  } catch (error) {
    console.error("[proxy] API base URL is not configured:", error);
    return NextResponse.json({ error: "API base URL is not configured" }, { status: 500 });
  }

  const params = await context.params;
  const rawSegments = params.path ?? [];
  const targetPath = rawSegments.join("/");

  // Before the session check on purpose: a path that leaves the API base is
  // refused whoever asks, and a 401 here would say only "log in and try again".
  const targetUrl = buildUpstreamUrl(apiBaseUrl, rawSegments);
  if (!targetUrl) {
    logger.warn("proxy.invalid_path", {
      path: targetPath.slice(0, MAX_LOGGED_PATH_LENGTH),
      method: request.method,
    });
    return NextResponse.json(INVALID_PATH_BODY, { status: 400 });
  }

  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;

  // Deny by default. This was previously an allowlist of protected first
  // segments, which is a denylist by omission: any backend resource added
  // upstream proxied unauthenticated until someone remembered to list it.
  // `analytics/*` and `admin/_ping` were both exposed that way, and the
  // OpenAPI contract marks both as secured.
  if (!isPublicApiPath(rawSegments) && !token) {
    logger.warn("proxy.unauthenticated", { path: targetPath, method: request.method });
    return NextResponse.json(SESSION_EXPIRED_BODY, { status: 401 });
  }

  const upstreamHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (FORWARDED_HEADER_BLOCKLIST.has(key.toLowerCase())) return;
    upstreamHeaders.set(key, value);
  });

  if (token) {
    upstreamHeaders.set("Authorization", `Bearer ${token}`);
  } else {
    upstreamHeaders.delete("Authorization");
  }

  const hasBody = request.body !== null && !["GET", "HEAD"].includes(request.method);

  // A streamed body can only be consumed once, so buffer it when a retry is
  // possible. GET and HEAD have no body and stay streamed.
  const bufferedBody = hasBody ? await request.arrayBuffer() : null;

  const send = (bearer: string | null) => {
    const headers = new Headers(upstreamHeaders);
    if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
    else headers.delete("Authorization");

    const init: RequestInit & { duplex?: "half" } = {
      method: request.method,
      headers,
      redirect: "manual",
    };
    if (bufferedBody !== null) {
      init.body = bufferedBody;
      init.duplex = "half";
    }
    return fetch(targetUrl, init);
  };

  let response: Response;
  let refreshed: Awaited<ReturnType<typeof refreshAccessToken>> = null;

  try {
    response = await send(token);

    // Retry once on 401. The backend issues 15-minute access tokens, so an
    // otherwise-valid session hits this constantly; without the retry the app
    // stops working a quarter of an hour after login.
    if (response.status === 401) {
      refreshed = await refreshAccessToken(request.cookies.get(REFRESH_COOKIE_NAME)?.value);
      if (refreshed) {
        logger.info("proxy.refreshed", { path: targetPath });
        response = await send(refreshed.token);
      }
    }
  } catch (error) {
    // Refused, timed out, unresolvable: the one fault the backend cannot report
    // itself, so it is logged at `error` here. This used to escape as an
    // unhandled rejection and a bare 500.
    logger.error("proxy.upstream_unreachable", {
      path: targetPath,
      method: request.method,
      error,
    });
    const unreachable = NextResponse.json(UPSTREAM_UNREACHABLE_BODY, { status: 502 });

    // The refresh may have succeeded before the retry failed. The backend has
    // then already rotated the token, and dropping the new pair here would leave
    // the browser holding a redeemed one: its next refresh reads as replay and
    // the whole session family is revoked.
    if (refreshed) applyRefreshedSession(unreachable.cookies, refreshed);
    return unreachable;
  }

  // A backend 5xx is the backend's to report, and it does, tagged with this
  // same id. `warn` keeps the line on stdout without a second event.
  if (response.status >= 500) {
    logger.warn("proxy.upstream_error", {
      path: targetPath,
      method: request.method,
      status: response.status,
      requestId: response.headers.get(REQUEST_ID_HEADER) ?? undefined,
    });
  }

  // Read before the header is stripped. `/auth/login` issues the refresh cookie
  // here, and this is the only point it passes through: login runs
  // `POST /api/proxy/auth/login` from the browser, so a cookie dropped here is
  // gone. That is what it used to be — the header was deleted wholesale, the
  // refresh cookie never existed on this origin, and every session ended when
  // its 15-minute access token did.
  const issuedRefreshToken = captureRefreshCookie(response.headers);

  const responseHeaders = new Headers(response.headers);
  ["content-encoding", "transfer-encoding", "content-length"].forEach((header) =>
    responseHeaders.delete(header),
  );

  // The backend's own Set-Cookie still never goes through verbatim: it is
  // scoped to `Path=/api/v1/auth/refresh`, a path this origin does not serve,
  // so the browser would store a cookie it never sends back. The value is
  // re-issued below against this origin instead.
  responseHeaders.delete("set-cookie");

  const proxied = new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });

  // Rotation means the refresh token changes on every use. Persisting the new
  // pair is what keeps the next refresh working.
  if (refreshed) applyRefreshedSession(proxied.cookies, refreshed);

  // Last writer wins, and an upstream-issued cookie is newer than a rotation
  // performed before the request was sent.
  if (issuedRefreshToken) {
    proxied.cookies.set(REFRESH_COOKIE_NAME, issuedRefreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_MAX_AGE_SECONDS,
    });
  }

  // A 401 that refresh could not rescue means the session is finished. Leaving
  // the cookies in place is what trapped users: the token was dead, every call
  // 401'd, and `/login` bounced back to the dashboard because a cookie existed.
  // Clearing here means the next navigation reaches the login form.
  if (response.status === 401 && !refreshed && token && !isPublicApiPath(rawSegments)) {
    logger.info("proxy.session.cleared", { path: targetPath });

    // Replace the upstream body, not just the cookies. Having just ended the
    // session, the proxy knows more about this 401 than the backend does, and
    // the backend's own wording — "Unauthorized: Invalid token" — is not a
    // sentence to put in front of a user. The `code` is what keeps the UI from
    // rendering this the same way it renders a wrong password.
    const expired = NextResponse.json(SESSION_EXPIRED_BODY, { status: 401 });
    clearSessionCookies(expired.cookies);
    return expired;
  }

  return proxied;
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const PATCH = proxyHandler;
export const DELETE = proxyHandler;
export const OPTIONS = proxyHandler;
