import { NextResponse } from "next/server";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { createTelemetryIntake } from "@/lib/telemetry-intake";

/**
 * Receives browser error reports: the three error boundaries and the window
 * listeners in `src/instrumentation-client.ts`, all through
 * `reportClientError`.
 *
 * Unauthenticated and browser-driven, so the intake bounds the body and the
 * number of lines a minute, and the payload is schema-validated before it
 * reaches the log stream.
 */

const MAX_BODY_BYTES = 8_192;

/** A page sends at most five reports per load; see `reportClientError`. */
const MAX_REPORTS_PER_MINUTE = 60;

const intake = createTelemetryIntake({
  event: "client.error",
  maxBytes: MAX_BODY_BYTES,
  perMinute: MAX_REPORTS_PER_MINUTE,
});

const ClientErrorSchema = z.object({
  kind: z.enum(["boundary", "uncaught", "unhandled-rejection"]).optional(),
  message: z.string().max(1_024).optional(),
  stack: z.string().max(4_000).optional(),
  digest: z.string().max(128).optional(),
  requestId: z.string().max(128).optional(),
  path: z.string().max(512).optional(),
});

export async function POST(request: Request) {
  // A refused or malformed report is not worth a log line of its own.
  const received = await intake(request);
  const parsed = received.ok ? ClientErrorSchema.safeParse(received.json) : null;

  if (parsed?.success) {
    logger.error("client.error", {
      ...parsed.data,
      userAgent: request.headers.get("user-agent")?.slice(0, 256) ?? undefined,
    });
  }

  return new NextResponse(null, { status: 204 });
}
