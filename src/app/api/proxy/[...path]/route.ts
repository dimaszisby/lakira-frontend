import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/constants/app";

const FALLBACK_API = "http://localhost:8001/api/v1";
const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? FALLBACK_API;
const PROTECTED_SEGMENTS = new Set([
  "metrics",
  "metric-categories",
  "metric-logs",
  "metric-settings",
  "users",
]);

const FORWARDED_HEADER_BLOCKLIST = new Set(["connection", "content-length", "host"]);

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function proxyHandler(request: NextRequest, context: RouteContext) {
  if (!API_BASE_URL) {
    return NextResponse.json({ error: "API base URL is not configured" }, { status: 500 });
  }

  const params = await context.params;
  const rawSegments = params.path ?? [];
  const targetPath = rawSegments.join("/");
  const targetUrl = new URL(API_BASE_URL.replace(/\/$/, "") + `/${targetPath}`);

  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  const requiresAuth = rawSegments.length === 0 ? false : PROTECTED_SEGMENTS.has(rawSegments[0]);

  if (requiresAuth && !token) {
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
