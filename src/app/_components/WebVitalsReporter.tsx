"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Reports Core Web Vitals from real sessions to the app's own endpoint.
 *
 * Until now web vitals were measured only in the lab, by the nightly Lighthouse
 * workflow. Lab numbers on CI hardware do not predict what users experience, so
 * the budgets in `docs/reference/performance-budget.md` went unmeasured in the
 * field.
 *
 * The POST is same-origin, which `connect-src 'self'` already permits — no CSP
 * change is required.
 */

const ENDPOINT = "/api/observability/web-vitals";

const WebVitalsReporter = () => {
  useReportWebVitals((metric) => {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: (metric as { rating?: string }).rating,
      id: metric.id,
      navigationType: metric.navigationType,
      path: window.location.pathname,
    });

    // sendBeacon survives page unload, which is when CLS and LCP are finalised.
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }

    // Fallback: keepalive lets the request outlive the document. Failures are
    // swallowed deliberately — telemetry must never surface to a user.
    void fetch(ENDPOINT, {
      method: "POST",
      body,
      keepalive: true,
      headers: { "content-type": "application/json" },
    }).catch(() => undefined);
  });

  return null;
};

export default WebVitalsReporter;
