import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { REFRESH_COOKIE_NAME } from "@/constants/app";
import { applyRefreshedSession, clearSessionCookies, refreshAccessToken } from "@/lib/auth-refresh";
import { isSessionTokenUsable } from "@/lib/jwt";
import { logger } from "@/lib/logger";
import { authRoutes } from "@/lib/routes";

/**
 * Revive an expired session during a page navigation, then continue to where
 * the user was going.
 *
 * ## Why a redirect instead of refreshing in the middleware
 *
 * The refresh cookie is scoped to `/api` on purpose, so page navigations do not
 * carry it. That makes it invisible to `src/proxy.ts`, which runs on page
 * paths — the middleware cannot read the cookie, let alone redeem it. Without
 * this route it could only bounce an expired token to `/login`, which is why a
 * session ended fifteen minutes after login however healthy its 30-day refresh
 * token was.
 *
 * Widening the cookie to `/` instead would be worse, not better.
 * `getServerAuthHeaders()` forwards every cookie it can see, so a server
 * component rendering through the proxy would start redeeming refresh tokens on
 * navigations. Its `Set-Cookie` goes to an internal fetch and is discarded, so
 * the rotated value would never reach the browser — and the next request, still
 * holding the superseded token, would be read as replay and revoke the family.
 * Keeping the cookie on `/api` means only a real browser request to `/api/*`
 * can rotate it, which is the only place the new cookie can actually land.
 *
 * ## On being a GET that mutates
 *
 * Redeeming rotates the token, so this is not a safe method in the HTTP sense.
 * It has to be a GET because a redirected navigation is a GET. The refresh
 * cookie is `SameSite=Strict`, so a cross-site request — an `<img>` tag, a
 * foreign form — carries no cookie and this route can do nothing with it. Only
 * a same-site navigation can reach the token at all.
 */
export async function GET(request: NextRequest) {
  const returnUrl = request.nextUrl.searchParams.get("returnUrl");
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  const refreshed = await refreshAccessToken(refreshToken);

  // A refreshed token that is *itself* unusable would send the middleware
  // straight back here, and the loop would rotate the family once per hop.
  // Treating it as a failed revival is what makes the redirect terminate: every
  // exit is either a usable session or `/login`, which the middleware does not
  // gate.
  if (!refreshed || !isSessionTokenUsable(refreshed.token)) {
    logger.info("auth.revive.failed", { hadRefreshToken: Boolean(refreshToken) });

    const response = NextResponse.redirect(new URL(authRoutes.login(returnUrl), request.url));
    // `authRoutes` rejects anything that is not a safe relative path, so a
    // `returnUrl` of `//evil.test` becomes a plain `/login`.
    clearSessionCookies(response.cookies);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  logger.info("auth.revive.succeeded");

  const response = NextResponse.redirect(new URL(authRoutes.afterAuth(returnUrl), request.url));
  applyRefreshedSession(response.cookies, refreshed);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
