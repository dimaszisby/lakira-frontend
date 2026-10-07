import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { createTelemetryIntake } from "@/lib/telemetry-intake";

/**
 * Sink for Content-Security-Policy violation reports, wired via `report-uri` in
 * `next.config.ts`.
 *
 * This endpoint is unauthenticated and browser-driven, so it is treated as a
 * hostile input: the intake bounds the body and the number of lines a minute,
 * and only the fields that are useful for diagnosis are kept. Previously it
 * logged only outside production, which meant it accepted and silently
 * discarded reports exactly where they matter.
 */

/** Reports are small. Anything larger is not a real CSP report. */
const MAX_BODY_BYTES = 8_192;

/** One broken page can report on every load, so this is a ceiling, not a rate. */
const MAX_REPORTS_PER_MINUTE = 60;

const intake = createTelemetryIntake({
  event: "csp.violation",
  maxBytes: MAX_BODY_BYTES,
  perMinute: MAX_REPORTS_PER_MINUTE,
});

/** Keep individual strings short so one report cannot flood the log stream. */
const MAX_FIELD_LENGTH = 512;

/**
 * A report field as it will be logged: a short string or a number. Anything
 * else is dropped, since no real report puts an object or an array there and
 * one would otherwise be logged whole.
 */
const toField = (value: unknown): string | number | undefined => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return undefined;
  return value.length > MAX_FIELD_LENGTH ? `${value.slice(0, MAX_FIELD_LENGTH)}...` : value;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Browsers send a mix of hyphenated (CSP Level 2) and camelCase (Reporting API)
 * field names. Pick the interesting ones from either shape.
 */
const summarise = (report: Record<string, unknown>) => {
  const pick = (...names: string[]) => {
    for (const name of names) {
      if (report[name] !== undefined) return toField(report[name]);
    }
    return undefined;
  };

  return {
    documentUri: pick("document-uri", "documentURL"),
    violatedDirective: pick("violated-directive", "effectiveDirective"),
    blockedUri: pick("blocked-uri", "blockedURL"),
    sourceFile: pick("source-file", "sourceFile"),
    lineNumber: pick("line-number", "lineNumber"),
    disposition: pick("disposition"),
  };
};

export async function POST(request: Request) {
  // Always 204 back to the browser. A report endpoint must never give a
  // violating page a reason to retry or surface an error to the user.
  const received = await intake(request);

  if (received.ok && isRecord(received.json)) {
    const nested = received.json["csp-report"];
    logger.warn("csp.violation", {
      ...summarise(isRecord(nested) ? nested : received.json),
      userAgent: toField(request.headers.get("user-agent") ?? undefined),
    });
  } else if (!received.ok && received.reason === "too-large") {
    logger.warn("csp.report.oversized", { maxBytes: MAX_BODY_BYTES });
  } else if (received.ok || received.reason === "malformed") {
    logger.warn("csp.report.invalid");
  }

  return new NextResponse(null, { status: 204 });
}
