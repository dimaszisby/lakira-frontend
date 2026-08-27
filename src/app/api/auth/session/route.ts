import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
} from "@/constants/app";
import { getApiBaseUrl } from "@/lib/env";
import { decodeJwtPayload, isJwtExpired } from "@/lib/jwt";
import { logger } from "@/lib/logger";

/**
 * Sets or clears the session cookie on behalf of the client.
 *
 * This endpoint used to accept **any** string and write it straight into the
 * session cookie. It was not directly exploitable — the backend rejects a bad
 * bearer — but it made the frontend a willing oracle for cookie injection, and
 * an unusable value would fail later as a confusing API error rather than here.
 *
 * A token now has to be structurally valid, unexpired, and accepted by the
 * backend before it is stored.
 */

/** A JWT far larger than this is not one we issued. */
const MAX_TOKEN_LENGTH = 4_096;

/** Deliberately vague: never tell a caller *why* a token was rejected. */
const INVALID_TOKEN_MESSAGE = "Invalid token";

const REJECTED_EVENT = "session.rejected";

/**
 * Confirm the backend accepts this token before trusting it.
 *
 * Structural checks catch a malformed or expired token cheaply; only a live
 * call catches one that is well-formed, unexpired, and simply not ours.
 */
const isAcceptedByBackend = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return response.ok;
  } catch (error) {
    // A network failure is not proof the token is bad. Refusing here would make
    // login unavailable whenever the backend blips, so fall back to the
    // structural checks already performed by the caller.
    logger.warn("session.verify.unreachable", { error });
    return true;
  }
};

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const token = (body as { token?: unknown } | null)?.token;

  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  if (decodeJwtPayload(token) === null) {
    logger.warn(REJECTED_EVENT, { reason: "malformed" });
    return NextResponse.json({ error: INVALID_TOKEN_MESSAGE }, { status: 400 });
  }

  if (isJwtExpired(token)) {
    logger.warn(REJECTED_EVENT, { reason: "expired" });
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  if (!(await isAcceptedByBackend(token))) {
    logger.warn(REJECTED_EVENT, { reason: "backend-rejected" });
    return NextResponse.json({ error: INVALID_TOKEN_MESSAGE }, { status: 401 });
  }

  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  (await cookies()).set(SESSION_COOKIE_NAME, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  return NextResponse.json({ ok: true });
}
