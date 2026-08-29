import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/constants/app";
import { isProtectedAppPath } from "@/lib/auth-paths";
import { isSessionTokenUsable } from "@/lib/jwt";

export function middleware(request: NextRequest) {
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

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnUrl", `${pathname}${request.nextUrl.search ?? ""}`);

  const response = NextResponse.redirect(loginUrl);

  // Clear a stale cookie on the way out, so the browser stops presenting a
  // token every downstream request will reject.
  if (token) {
    response.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  }

  return response;
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
