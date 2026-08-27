import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/constants/app";
import { isPublicApiPath } from "@/lib/auth-paths";
import { getApiBaseUrl } from "@/lib/env";
import { logger } from "@/lib/logger";

const FORWARDED_HEADER_BLOCKLIST = new Set(["connection", "content-length", "host"]);

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
  const targetUrl = new URL(`${apiBaseUrl}/${targetPath}`);

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers: upstreamHeaders,
    redirect: "manual",
  };

  const hasBody = request.body !== null && !["GET", "HEAD"].includes(request.method);
  if (hasBody && request.body) {
    init.body = request.body;
    init.duplex = "half";
  }

  const response = await fetch(targetUrl, init);
  const responseHeaders = new Headers(response.headers);
  ["content-encoding", "transfer-encoding", "content-length"].forEach((header) =>
    responseHeaders.delete(header),
  );

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const PATCH = proxyHandler;
export const DELETE = proxyHandler;
export const OPTIONS = proxyHandler;
