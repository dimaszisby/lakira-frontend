import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { REFRESH_COOKIE_NAME } from "@/constants/app";
import {
  applyRefreshedSession,
  clearSessionCookies,
  refreshAccessToken,
  UNAVAILABLE_GRACE_MS,
} from "@/lib/auth-refresh";
import { clientAddress } from "@/lib/client-address";
import { isSessionTokenUsable } from "@/lib/jwt";
import { logger } from "@/lib/logger";
import { authRoutes } from "@/lib/routes";

// A relative `Location`, which the browser resolves against the origin it asked for (RFC 9110
// § 10.2.2). Not `new URL(path, request.url)`: in the production image `request.url` is the bind
// address, so behind a reverse proxy that sent users to `https://0.0.0.0:3000` (#218).
// `NextResponse.redirect` accepts only an absolute URL, hence the plain response.
//
// The path still goes through the URL parser, against a placeholder origin that is then dropped.
// `afterAuth` returns `returnUrl` as decoded, and a header value cannot hold a character above
// U+00FF or a line break: the response would throw after the refresh token rotated, and the lost
// cookie would revoke the family on its next use. Parsing percent-encodes the one and strips the
// other, as the old `new URL` did. Which paths are let through is `authRoutes`' decision, and it
// drops one that parses to another origin and returns the parsed form (#226), which this parse
// leaves as it is.
const PLACEHOLDER_ORIGIN = "http://revive.invalid";

const redirectTo = (path: string) => {
  const { pathname, search, hash } = new URL(path, PLACEHOLDER_ORIGIN);
  return new NextResponse(null, {
    status: 307,
    headers: { Location: `${pathname}${search}${hash}` },
  });
};

/** `&`, `<`, `>` and `"`, the characters that could end the attribute or open markup. */
const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * The answer when the backend could not answer the refresh (#220). The session is
 * kept: nothing says it is over, and clearing it signed out everyone whose access
 * token expired during a backend restart.
 *
 * A page with a link, not a redirect. Sent on to `returnUrl`, the user would be
 * sent straight back here by the middleware, and each hop would ask the backend
 * again; an automatic reload would do the same. "Sign in again" is the way out if
 * the backend keeps failing: nothing here ends the session on its own. No script
 * and no styles beyond
 * the browser's, so the static policy `/api` routes get is enough.
 */
const unavailablePage = (returnUrl: string | null) => {
  const retry = escapeHtml(authRoutes.revive(returnUrl));
  const signIn = escapeHtml(authRoutes.login(returnUrl));
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lakira cannot reach the server</title>
</head>
<body>
<main>
<h1>We can't reach the server right now</h1>
<p>You're still signed in. Try again in a moment.</p>
<p><a href="${retry}">Try again</a></p>
<p>Or <a href="${signIn}">sign in again</a>.</p>
</main>
</body>
</html>
`;
  return new NextResponse(html, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Retry-After": String(UNAVAILABLE_GRACE_MS / 1000),
    },
  });
};

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

  const refreshed = await refreshAccessToken(refreshToken, clientAddress(request.headers));

  if (refreshed.status === "unavailable") {
    logger.warn("auth.revive.unavailable");
    return unavailablePage(returnUrl);
  }

  // A refreshed token that is *itself* unusable would send the middleware
  // straight back here, and the loop would rotate the family once per hop.
  // Treating it as a failed revival is what makes the redirect terminate: every
  // exit is a usable session, `/login`, which the middleware does not gate, or
  // the page above, which redirects nowhere.
  if (refreshed.status === "rejected" || !isSessionTokenUsable(refreshed.token)) {
    logger.info("auth.revive.failed", { hadRefreshToken: Boolean(refreshToken) });

    const response = redirectTo(authRoutes.login(returnUrl));
    // `authRoutes` rejects anything that is not a safe relative path, so a
    // `returnUrl` of `//evil.test` becomes a plain `/login`.
    clearSessionCookies(response.cookies);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  logger.info("auth.revive.succeeded");

  const response = redirectTo(authRoutes.afterAuth(returnUrl));
  applyRefreshedSession(response.cookies, refreshed);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
