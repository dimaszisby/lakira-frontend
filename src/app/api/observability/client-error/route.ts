import { NextResponse } from "next/server";
import { z } from "zod";

import { logger } from "@/lib/logger";

/**
 * Receives browser error reports: the three error boundaries and the window
 * listeners in `src/instrumentation-client.ts`, all through
 * `reportClientError`.
 *
 * Unauthenticated and browser-driven, so the payload is size-capped and
 * schema-validated before it reaches the log stream.
 */

const MAX_BODY_BYTES = 8_192;

const ClientErrorSchema = z.object({
  kind: z.enum(["boundary", "uncaught", "unhandled-rejection"]).optional(),
  message: z.string().max(1_024).optional(),
  stack: z.string().max(4_000).optional(),
  digest: z.string().max(128).optional(),
  requestId: z.string().max(128).optional(),
  path: z.string().max(512).optional(),
});

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 204 });

    const parsed = ClientErrorSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return new NextResponse(null, { status: 204 });

    logger.error("client.error", {
      ...parsed.data,
      userAgent: request.headers.get("user-agent")?.slice(0, 256) ?? undefined,
    });
  } catch {
    // A malformed report is not worth a log line of its own.
  }

  return new NextResponse(null, { status: 204 });
}
