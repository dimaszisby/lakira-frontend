import { createFixedWindow } from "@/lib/fixed-window";
import { logger } from "@/lib/logger";
import { discard, readCapped } from "@/lib/read-capped";

/**
 * The front door for a route that accepts reports from the browser.
 *
 * Such a route is unauthenticated by necessity, so anyone can post to it. Two
 * things are bounded here, before the route sees anything:
 *
 * - **How much is buffered.** The body is refused on its declared length, or
 *   read as a stream and cancelled once it passes the cap. The cap is in bytes.
 *   Until 2026-10-06 each route called `request.text()` and then compared the
 *   string's length, which buffered the whole body first and counted characters.
 * - **How often it logs.** Each intake has a per-minute budget. Past it the body
 *   is not read and nothing is written.
 *
 * The budget is per process and per intake. It is not a per-client limit: one
 * caller can spend it, and real reports are then dropped until the window turns.
 */

type TelemetryIntakeOptions = {
  /** Names the intake on the `telemetry.suppressed` line. */
  event: string;
  maxBytes: number;
  perMinute: number;
  /** Injected in tests. */
  now?: () => number;
};

export type TelemetryIntakeResult =
  | { ok: true; json: unknown }
  | { ok: false; reason: "over-budget" | "too-large" | "malformed" };

export type TelemetryIntake = (request: Request) => Promise<TelemetryIntakeResult>;

const WINDOW_MS = 60_000;

/** The message written once after a window in which requests were dropped. */
export const TELEMETRY_SUPPRESSED_MSG = "telemetry.suppressed";

export const createTelemetryIntake = ({
  event,
  maxBytes,
  perMinute,
  now,
}: TelemetryIntakeOptions): TelemetryIntake => {
  const take = createFixedWindow({ limit: perMinute, windowMs: WINDOW_MS, now });

  return async (request) => {
    const { allowed, suppressed } = take();
    if (suppressed > 0) logger.warn(TELEMETRY_SUPPRESSED_MSG, { event, dropped: suppressed });

    if (!allowed) {
      await discard(request);
      return { ok: false, reason: "over-budget" };
    }

    try {
      const raw = await readCapped(request, maxBytes);
      if (raw === null) return { ok: false, reason: "too-large" };

      return { ok: true, json: JSON.parse(raw) as unknown };
    } catch {
      // Not JSON, or the client went away mid-body.
      return { ok: false, reason: "malformed" };
    }
  };
};
