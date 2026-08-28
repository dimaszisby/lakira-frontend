import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
} from "@/constants/app";
import { captureRefreshCookie } from "@/lib/auth-refresh";
import { getApiBaseUrl } from "@/lib/env";
import { decodeJwtPayload } from "@/lib/jwt";
import { logger } from "@/lib/logger";

/**
 * Server-side login. Exchanges credentials for a session cookie so the token
 * never reaches JavaScript.
 *
 * ## Why this does not go through `/api/proxy`
 *
 * The proxy exists so the **browser** never talks to the backend directly. This
 * is already server-side code, so calling the backend here is the same thing the
 * proxy itself does. Routing through it would make the server issue an HTTP
 * request to itself — an extra hop, an absolute URL to resolve, and no security
 * gain. The 2026-08-24 audit listed the "bypass" as a defect; on inspection it
 * is the correct shape, and the finding is withdrawn.
 */

/**
 * The backend wraps every response in `{status, message, data}` — see
 * `.claude/rules/data-access.md`. This route previously read `token` and `user`
 * from the top level, so both were always `undefined` and the session cookie
 * was set to the string "undefined". The Phase 5a token validation turned that
 * silent failure into a visible 502, which is how it surfaced.
 */
type LoginResponse = {
  data?: {
    token?: unknown;
    user?: unknown;
  };
};

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);

  if (body === null || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    logger.error("login.upstream.unreachable", { error });
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 502 });
  }

  // An upstream error page or a proxy timeout is not JSON. Parsing without a
  // guard turned those into an unhandled rejection rather than a useful status.
  const data = (await upstream.json().catch(() => null)) as LoginResponse | null;

  if (!upstream.ok) {
    return NextResponse.json(data ?? { error: "Login failed" }, { status: upstream.status });
  }

  // Only trust a structurally valid JWT. Storing whatever arrived would defer
  // the failure to the next request, where it reads as an unexplained 401.
  const token = data?.data?.token;

  if (typeof token !== "string" || decodeJwtPayload(token) === null) {
    logger.error("login.upstream.malformed", { hasToken: typeof token });
    return NextResponse.json(
      { error: "Authentication service returned an invalid token" },
      {
        status: 502,
      },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  // The backend scopes its refresh cookie to Path=/api/v1/auth/refresh, a path
  // this origin does not serve. Storing it verbatim would give the browser a
  // cookie it never sends back, so re-scope it to this app's auth routes.
  // Without this the access token still expires in 15 minutes with no recovery.
  const refreshToken = captureRefreshCookie(upstream.headers);
  if (refreshToken) {
    cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_MAX_AGE_SECONDS,
    });
  }

  return NextResponse.json({ user: data?.data?.user });
}
