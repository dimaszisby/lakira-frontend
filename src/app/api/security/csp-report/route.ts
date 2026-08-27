import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";

/**
 * Sink for Content-Security-Policy violation reports, wired via `report-uri` in
 * `next.config.ts`.
 *
 * This endpoint is unauthenticated and browser-driven, so it is treated as a
 * hostile input: the body is size-capped before parsing and only the fields
 * that are useful for diagnosis are kept. Previously it logged only outside
 * production, which meant it accepted and silently discarded reports exactly
 * where they matter.
 */

/** Reports are small. Anything larger is not a real CSP report. */
const MAX_BODY_BYTES = 8_192;

/** Keep individual strings short so one report cannot flood the log stream. */
const MAX_FIELD_LENGTH = 512;

type CspReportBody = {
  "csp-report"?: Record<string, unknown>;
};

const truncate = (value: unknown): unknown =>
  typeof value === "string" && value.length > MAX_FIELD_LENGTH
    ? `${value.slice(0, MAX_FIELD_LENGTH)}...`
    : value;

/**
 * Browsers send a mix of hyphenated (CSP Level 2) and camelCase (Reporting API)
 * field names. Pick the interesting ones from either shape.
 */
const summarise = (report: Record<string, unknown>) => {
  const pick = (...names: string[]) => {
    for (const name of names) {
      if (report[name] !== undefined) return truncate(report[name]);
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
  try {
    const raw = await request.text();

    if (raw.length > MAX_BODY_BYTES) {
      logger.warn("csp.report.oversized", { bytes: raw.length });
      return new NextResponse(null, { status: 204 });
    }

    const body = JSON.parse(raw) as CspReportBody;
    const report = body["csp-report"] ?? (body as Record<string, unknown>);

    logger.warn("csp.violation", {
      ...summarise(report),
      userAgent: truncate(request.headers.get("user-agent") ?? undefined),
    });
  } catch (error) {
    logger.warn("csp.report.invalid", { error });
  }

  return new NextResponse(null, { status: 204 });
}
