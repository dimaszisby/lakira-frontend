import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { REFRESH_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/constants/app";
import { clearSessionCookies } from "@/lib/auth-refresh";
import { getApiBaseUrl } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * End the session, on the backend and on this origin.
 *
 * ## Why the client calls here rather than the proxy
 *
 * It used to call `POST /api/proxy/auth/logout`, which revoked the refresh
 * family upstream and then changed nothing locally: the proxy strips the
 * backend's `Set-Cookie`, and this route — the only code that deletes
 * `lakira_token` — was never reached. The app reported "Logged out
 * successfully" and pushed to `/login`, which saw the surviving cookie and
 * redirected back to the dashboard. The session outlived every attempt to end
 * it.
 *
 * Being a route handler rather than a proxied call is also what lets the
 * backend hear about it at all. The refresh cookie is scoped to `/api`, so it
 * reaches this path, and it is the only credential the backend's `/auth/logout`
 * can use to find the token family to revoke.
 *
 * ## The upstream call cannot fail the logout
 *
 * A user who asks to be logged out is logged out, whatever the backend says. An
 * unreachable backend leaves a refresh token live until it expires, which is
 * worth a log line; refusing to clear the cookies would leave the session fully
 * usable, which is worse in every way.
 */
export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
  const accessToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  try {
    const headers = new Headers();
    if (refreshToken) headers.set("cookie", `${REFRESH_COOKIE_NAME}=${refreshToken}`);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

    const upstream = await fetch(`${getApiBaseUrl()}/auth/logout`, {
      method: "POST",
      headers,
      cache: "no-store",
    });

    if (!upstream.ok) {
      logger.warn("auth.logout.upstream.rejected", { status: upstream.status });
    }
  } catch (error) {
    logger.warn("auth.logout.upstream.unreachable", { error });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response.cookies);
  return response;
}
