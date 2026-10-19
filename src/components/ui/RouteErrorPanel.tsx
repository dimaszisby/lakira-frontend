"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";
import { reportClientError } from "@/lib/monitoring/report-client-error";

import { Button } from "./Button";

export type RouteErrorPanelProps = {
  /** What Next hands an `error.tsx`. Its `message` is never shown; see below. */
  error: Error & { digest?: string };
  /** Next's `retry`: fetches and renders the segment again. Not `reset`, which only clears. */
  retry: () => void;
  title: string;
  /** 1 where the panel replaces the whole page; 2 where it sits below content that stays. */
  headingLevel?: 1 | 2;
  /** Width and spacing are the route's: the panel fills whatever it is put in. */
  className?: string;
};

/**
 * The fallback every `error.tsx` renders, so that all of them say the same thing the same way.
 *
 * The error's message is not for the user. From a Server Component it is a generic sentence in
 * production and the real text is in `digest`'s server log line; from a Client Component it is
 * whatever the code threw, which can hold an address, a URL or a query. So the copy is fixed and
 * the digest, when there is one, is the reference a user can quote.
 */
export const RouteErrorPanel = ({
  error,
  retry,
  title,
  headingLevel = 1,
  className,
}: RouteErrorPanelProps) => {
  useEffect(() => {
    console.error(`${title}:`, error);
    reportClientError(error, "boundary");
  }, [error, title]);

  const sectionRef = useRef<HTMLElement>(null);

  // A successful retry unmounts the panel with focus on its button, and focus would fall to the
  // body, sending a keyboard or screen-reader user back to the top of the document. So on unmount
  // it goes to the page's `main` (register row F-45), but only if focus has been in the panel and
  // is lost now. If the user had moved on, to a link say, focus is left where they put it; and a
  // panel focus never entered, as on Strict Mode's extra cleanup in `next dev`, moves nothing.
  useEffect(() => {
    const section = sectionRef.current;
    const main = section?.closest("main");
    let hasHadFocus = false;
    const onFocusIn = () => {
      hasHadFocus = true;
    };
    section?.addEventListener("focusin", onFocusIn);

    return () => {
      section?.removeEventListener("focusin", onFocusIn);
      const active = document.activeElement;
      const isLost = !active || active === document.body || !active.isConnected;
      if (main && hasHadFocus && isLost) main.focus();
    };
  }, []);

  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section
      ref={sectionRef}
      role="alert"
      className={cn("rounded-xl border border-status-error bg-surface p-8 text-center", className)}
    >
      <Heading className="text-2xl font-semibold text-ink-error">{title}</Heading>
      <p className="mt-2 text-sm text-ink-secondary">
        Something went wrong on our side. Trying again often resolves it.
      </p>
      {error.digest ? (
        <p className="mt-2 text-sm text-ink-secondary">
          Reference: <code>{error.digest}</code>
        </p>
      ) : null}
      <div className="mt-6 flex justify-center">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            retry();
          }}
        >
          Try again
        </Button>
      </div>
    </section>
  );
};
