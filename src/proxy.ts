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
import {
  buildContentSecurityPolicy,
  createNonce,
  CSP_HEADER,
  NONCE_HEADER,
  originOf,
} from "@/lib/csp";
import { clientEnv } from "@/lib/env";
import { isSessionTokenUsable } from "@/lib/jwt";
import { authRoutes } from "@/lib/routes";

const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Let the request through with a Content Security Policy that allows script by
 * a nonce made for this response alone (ADR-0026).
 *
 * The policy goes on the *request* as well as the response. Next reads the nonce
 * from the request's policy and stamps it on the scripts it emits; set only on
 * the response, the browser would be told to require a nonce that no script
 * carries, and the page would not hydrate.
 */
const passWithPolicy = (request: NextRequest): NextResponse => {
  const nonce = createNonce();
  const policy = buildContentSecurityPolicy({
    nonce,
    isDev: IS_DEV,
    apiOrigin: originOf(clientEnv.NEXT_PUBLIC_API_BASE_URL),
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_HEADER, nonce);
  requestHeaders.set(CSP_HEADER, policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(CSP_HEADER, policy);
  return response;
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedAppPath(pathname)) {
    return passWithPolicy(request);
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Checks expiry, not just presence. An expired or malformed token used to
  // pass this gate and fail downstream as an opaque API error instead of a
  // clean redirect. The signature is deliberately not verified here — that
  // needs the backend's secret, and the backend re-checks on every proxied
  // request anyway.
  if (isSessionTokenUsable(token)) {
    return passWithPolicy(request);
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
  // Every page, because every page needs a nonce; which ones are gated is
  // decided above by `isProtectedAppPath`. Route handlers and Next's static
  // output are left out: they have no document to protect, and a redirect here
  // would block CSS, JS or images from loading.
  //
  // Next.js requires this to be a literal ("matcher needs to be a static
  // string or array of static strings"), so it repeats PROXY_MATCHER from
  // src/lib/auth-paths.ts. src/lib/__tests__/auth-paths.test.ts asserts the two
  // are equal and that the pattern covers every protected path.
  matcher: ["/((?!api(?:/|$)|_next/static(?:/|$)|_next/image(?:/|$)).*)"],
};
