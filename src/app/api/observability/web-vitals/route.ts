import { NextResponse } from "next/server";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { createTelemetryIntake } from "@/lib/telemetry-intake";

/**
 * Receives Core Web Vitals beacons from `WebVitalsReporter`.
 *
 * Unauthenticated and browser-driven, so the payload is treated as hostile:
 * the intake bounds the body and the number of lines a minute, then the beacon
 * is schema-validated and reduced to known fields before logging.
 */

const MAX_BODY_BYTES = 2_048;

/** One page load sends about six beacons, so this is roughly a hundred loads. */
const MAX_BEACONS_PER_MINUTE = 600;

const intake = createTelemetryIntake({
  event: "web-vital",
  maxBytes: MAX_BODY_BYTES,
  perMinute: MAX_BEACONS_PER_MINUTE,
});

const WebVitalSchema = z.object({
  name: z.enum(["CLS", "FCP", "FID", "INP", "LCP", "TTFB", "Next.js-hydration"]).or(z.string()),
  value: z.number().finite(),
  rating: z.enum(["good", "needs-improvement", "poor"]).optional(),
  id: z.string().max(128).optional(),
  navigationType: z.string().max(32).optional(),
  path: z.string().max(512).optional(),
});

export async function POST(request: Request) {
  // A refused or malformed beacon is not worth a log line of its own.
  const received = await intake(request);
  const parsed = received.ok ? WebVitalSchema.safeParse(received.json) : null;

  if (parsed?.success) {
    const { name, value, rating, id, navigationType, path } = parsed.data;
    logger.info("web-vital", {
      metric: name,
      // Sub-millisecond precision is noise for every metric except CLS.
      value: name === "CLS" ? Number(value.toFixed(4)) : Math.round(value),
      rating,
      id,
      navigationType,
      path,
    });
  }

  return new NextResponse(null, { status: 204 });
}
