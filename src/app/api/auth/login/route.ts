import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
} from "@/constants/app";
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

type LoginResponse = {
  token?: unknown;
  user?: unknown;
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
  if (typeof data?.token !== "string" || decodeJwtPayload(data.token) === null) {
    logger.error("login.upstream.malformed", { hasToken: typeof data?.token });
    return NextResponse.json(
      { error: "Authentication service returned an invalid token" },
      {
        status: 502,
      },
    );
  }

  (await cookies()).set(SESSION_COOKIE_NAME, data.token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ user: data.user });
}
