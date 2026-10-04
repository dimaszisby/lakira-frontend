import type { Instrumentation } from "next";

/**
 * Next's server instrumentation hooks. Both delegate to
 * `src/lib/monitoring/server.ts`, loaded only in the Node runtime.
 *
 * Each check is a positive `if` on `process.env.NEXT_RUNTIME` on purpose. Next
 * replaces that expression at build time and drops the dead branch, so the
 * Node-only logger and SDK are never compiled into an Edge bundle. Nothing in
 * this app runs on Edge today (`src/proxy.ts` is Node); if that changes, errors
 * there are not reported until this file gains an Edge branch.
 */

/** Runs once per server process, before it handles a request. */
export const register = async (): Promise<void> => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startMonitoring } = await import("@/lib/monitoring/server");
    await startMonitoring();
  }
};

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportRequestError } = await import("@/lib/monitoring/server");
    await reportRequestError(error, request, context);
  }
};
