import { NextResponse } from "next/server";
import { z } from "zod";

import { logger } from "@/lib/logger";

/**
 * Receives Core Web Vitals beacons from `WebVitalsReporter`.
 *
 * Unauthenticated and browser-driven, so the payload is treated as hostile:
 * size-capped, schema-validated, and reduced to known fields before logging.
 */

const MAX_BODY_BYTES = 2_048;

const WebVitalSchema = z.object({
  name: z.enum(["CLS", "FCP", "FID", "INP", "LCP", "TTFB", "Next.js-hydration"]).or(z.string()),
  value: z.number().finite(),
  rating: z.enum(["good", "needs-improvement", "poor"]).optional(),
  id: z.string().max(128).optional(),
  navigationType: z.string().max(32).optional(),
  path: z.string().max(512).optional(),
});

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return new NextResponse(null, { status: 204 });
    }

    const parsed = WebVitalSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return new NextResponse(null, { status: 204 });
    }

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
  } catch {
    // A malformed beacon is not worth a log line of its own.
  }

  return new NextResponse(null, { status: 204 });
}
