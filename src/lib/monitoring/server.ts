import type { Instrumentation } from "next";

import { getMonitoringConfig } from "@/lib/env";
import { logger, setLogSink } from "@/lib/logger";

import { scrubSentryEvent, stripQuery } from "./scrub";
import { createSentrySink } from "./sentry-sink";

/**
 * The Node-only half of `src/instrumentation.ts`.
 *
 * Kept out of that file so nothing here is compiled into an Edge bundle: the
 * logger writes to `process.stdout`, and the vendor SDK is Node-only.
 */

/**
 * Start error monitoring if a DSN is configured. Off by default: the vendor
 * package is loaded by dynamic import, so a deployment or fork without a DSN
 * never evaluates it. Sentry runs on the server only; see ADR-0024.
 */
export const startMonitoring = async (): Promise<void> => {
  const config = getMonitoringConfig();
  if (!config) return;

  try {
    const Sentry = await import("@sentry/node");

    Sentry.init({
      dsn: config.dsn,
      release: config.release,
      environment: process.env.NODE_ENV,
      // Errors only. Tracing is a separate decision (backend ADR-0038).
      tracesSampleRate: 0,
      // A message event would otherwise carry the stack of the sink's own call
      // site, which says nothing about the error and groups unrelated ones.
      attachStacktrace: false,
      // This SDK major collects by default; every category is switched off, and
      // the scrubber below still runs on whatever is passed explicitly.
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
        stackFrameVariables: false,
      },
      // The defaults patch `http` and `fetch` inside Next's own server and
      // attach request data. Error reporting needs none of that.
      defaultIntegrations: false,
      integrations: [Sentry.linkedErrorsIntegration(), Sentry.dedupeIntegration()],
      beforeSend: scrubSentryEvent,
    });

    setLogSink(createSentrySink(Sentry));
    logger.info("monitoring.enabled", { provider: "sentry" });
  } catch (error) {
    // Fail soft: the app runs without monitoring rather than not at all.
    logger.warn("monitoring.init_failed", { error });
  }
};

/**
 * Server errors Next catches: Server Component renders, route handlers, server
 * actions and the proxy. Logged at `error`, which the sink forwards.
 *
 * No headers are logged, and the path loses its query string: reset and invite
 * links carry their token there.
 */
export const reportRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;

  logger.error("server.request_error", {
    error,
    digest,
    method: request.method,
    path: stripQuery(request.path),
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
