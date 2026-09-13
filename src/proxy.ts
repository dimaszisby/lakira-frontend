/**
 * The edge session gate. Runs before any protected page is rendered.
 *
 * ## Why this file is called `proxy.ts`, and why it lives under `src/`
 *
 * Next.js 16 deprecated the `middleware` convention and renamed it to `proxy`.
 * The file also has to sit beside `app` — which here means `src/`, not the
 * repository root.
 *
 * This was `middleware.ts` at the repository root, which satisfied neither
 * condition, so **Next never loaded it and the gate did not run**. It was not
 * failing loudly: an unauthenticated request still ended up at `/login`,
 * because `src/app/(app)/layout.tsx` redirects too. The difference only showed
 * in what that fallback cannot do — it has no `returnUrl`, so every expired
 * session lost its place, and it runs after the route has begun rendering.
 * Verified on 2026-09-12 by returning a marker header from here and finding it
 * absent from the response.
 *
 * Nothing to do with `src/app/api/proxy/[...path]`, which forwards API calls to
 * the backend. The name collision is Next's.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/constants/app";
import { isProtectedAppPath } from "@/lib/auth-paths";
import { isSessionTokenUsable } from "@/lib/jwt";
import { authRoutes } from "@/lib/routes";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedAppPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Checks expiry, not just presence. An expired or malformed token used to
  // pass this gate and fail downstream as an opaque API error instead of a
  // clean redirect. The signature is deliberately not verified here — that
  // needs the backend's secret, and the backend re-checks on every proxied
  // request anyway.
  if (isSessionTokenUsable(token)) {
    return NextResponse.next();
  }

  const returnUrl = `${pathname}${request.nextUrl.search ?? ""}`;

  // An expired access token is not an ended session. The backend issues
  // 15-minute access tokens against a 30-day refresh token, so this branch is
  // reached routinely by anyone who stopped typing for a quarter of an hour.
  //
  // The refresh cookie is scoped to `/api`, which is exactly why it cannot be
  // read here — a page navigation does not carry it. Sending the request to a
  // route under `/api` is what puts it somewhere the cookie exists; that route
  // redeems it and redirects back. Bouncing straight to `/login` instead is
  // what ended every session after fifteen minutes, refresh token or not.
  if (token) {
    const reviveUrl = new URL("/api/auth/revive", request.url);
    reviveUrl.searchParams.set("returnUrl", returnUrl);
    return NextResponse.redirect(reviveUrl);
  }

  // No cookie at all: nothing to revive.
  return NextResponse.redirect(new URL(authRoutes.login(returnUrl), request.url));
}

export const config = {
  // Next.js requires this to be statically analysable, so it cannot be derived
  // from PROTECTED_APP_PATHS at runtime — a computed value fails the build with
  // "matcher needs to be a static string or array of static strings".
  //
  // The two are therefore kept in sync by a test:
  // src/lib/__tests__/auth-paths.test.ts asserts this array equals
  // PROTECTED_APP_MATCHERS. Add a protected section in auth-paths.ts, then here.
  matcher: [
    "/dashboard/:path*",
    "/metrics/:path*",
    "/metric-categories/:path*",
    "/account/:path*",
    "/organization/:path*",
  ],
};
