import { reportClientError } from "@/lib/monitoring/report-client-error";

/**
 * Runs in the browser before the app becomes interactive.
 *
 * React's error boundaries catch render errors only. An error thrown in an
 * event handler, a timer, or a promise nobody awaits reaches neither
 * `error.tsx` nor `global-error.tsx`, so before this file those were invisible.
 */

window.addEventListener("error", (event) => {
  // Only real `Error`s. A cross-origin script reports the opaque string
  // "Script error.", and layout notices such as the ResizeObserver one arrive
  // with no error object at all; neither is actionable.
  if (event.error instanceof Error) reportClientError(event.error, "uncaught");
});

window.addEventListener("unhandledrejection", (event) => {
  reportClientError(event.reason, "unhandled-rejection");
});
