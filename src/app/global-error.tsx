"use client";

import { useEffect } from "react";

import { reportClientError } from "@/lib/monitoring/report-client-error";
import { Button } from "@/ui/Button";

/**
 * Last-resort error boundary. Replaces the root layout when a render throws
 * above every nested `error.tsx`, so it must render its own `<html>`/`<body>`.
 *
 * Only two route subtrees had an `error.tsx` before this; anything else showed
 * the raw Next.js default.
 *
 * The report goes to the app's own endpoint rather than a vendor SDK in the
 * browser. The server's registered `LogSink` decides where it goes next; see
 * `src/instrumentation.ts`.
 */

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  useEffect(() => {
    // `digest` is the server-side correlation id; the message is omitted on the
    // server for security, so the digest is what ties this to a server log line.
    reportClientError(error, "boundary");
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-dvh font-sans antialiased">
        <main className="flex min-h-dvh flex-col items-center justify-center gap-6">
          <h1 className="text-center">Something went wrong</h1>
          <p className="max-w-prose text-center">
            An unexpected error occurred. Trying again often resolves it.
          </p>
          {error.digest ? (
            <p className="max-w-prose text-center text-sm">
              Reference: <code>{error.digest}</code>
            </p>
          ) : null}
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
