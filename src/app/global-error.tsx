"use client";

import "@/styles/globals.css";

import { useEffect } from "react";

import { THEME_STORAGE_KEY } from "@/constants/app";
import { reportClientError } from "@/lib/monitoring/report-client-error";
import { Button } from "@/ui/Button";

import { plusJakartaSans, quicksand } from "./fonts";

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
  /** Next's `retry`: fetches and renders again. `reset` only clears the error and re-renders the
   * same failed payload, so it could not recover a server error (kit `route-error-boundaries`,
   * D-01; register row F-46). */
  retry: () => void;
};

/**
 * The theme next-themes would apply, read the way its pre-paint script reads it: the stored
 * choice under `THEME_STORAGE_KEY`, with `system` (the default in `src/app/providers.tsx`)
 * resolved from the OS. Keep it in step with that provider's config.
 */
const resolveStoredTheme = (): "light" | "dark" => {
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    // Storage can be blocked; fall through to the OS setting.
  }
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const GlobalError = ({ error, retry }: GlobalErrorProps) => {
  useEffect(() => {
    // `digest` is the server-side correlation id; the message is omitted on the
    // server for security, so the digest is what ties this to a server log line.
    reportClientError(error, "boundary");
  }, [error]);

  // This page replaces the root layout, so next-themes never runs here and `data-theme` is unset
  // (register row F-64). An effect rather than next-themes' inline script: that script needs the
  // CSP nonce, which only the server layout can read (ADR-0026). The cost is one light paint
  // before hydration for someone who chose dark.
  useEffect(() => {
    const theme = resolveStoredTheme();
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, []);

  return (
    <html lang="en" className={`${quicksand.variable} ${plusJakartaSans.variable}`}>
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
          <Button
            variant="primary"
            onClick={() => {
              retry();
            }}
          >
            Try again
          </Button>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
