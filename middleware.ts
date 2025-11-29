import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/metrics", "/metric-categories", "/account"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiresAuth = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const tokenCookie = request.cookies.get("lakira_token");

  if (tokenCookie?.value) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const targetPath = `${pathname}${request.nextUrl.search ?? ""}`;
  loginUrl.searchParams.set("returnUrl", targetPath);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/metrics/:path*", "/metric-categories/:path*", "/account/:path*"],
};
