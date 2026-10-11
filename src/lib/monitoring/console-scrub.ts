import { format } from "node:util";

import { redact } from "@/lib/logger";

/**
 * Scrub what the server prints with `console.error`. See ADR-0029.
 *
 * Next prints a request error itself after it has called `onRequestError`, raw:
 * an address or a reset token in the message reaches the log drain on the line
 * beside the logger's scrubbed one. `next start` has no switch for that line, so
 * the method it is printed with is wrapped instead.
 */

/**
 * On `globalThis`, not in a module variable, for the reason the logger's sink
 * is: Next bundles this file into more than one chunk, and a second copy must
 * see that the first already wrapped the method.
 */
const MARKER = Symbol.for("lakira.console.scrubbed");

/** Printed in place of a call whose arguments could not be formatted. */
export const UNPRINTABLE = "[unprintable console.error arguments]";

type MarkerRegistry = { [MARKER]?: boolean };

const registry = globalThis as MarkerRegistry;

/**
 * Replace `console.error` with one that prints a single scrubbed string.
 *
 * The arguments are formatted as `console.error` formats them and passed
 * through the logger's `redact`, so the patterns and the length cut are the
 * logger's own. The values themselves are not touched: the error that was
 * thrown still reaches `onRequestError` and the sink as it was.
 *
 * Production only. In development Next prints through its own path, and a
 * flattened string would make a local stack trace harder to read.
 */
export const scrubConsoleErrors = (): void => {
  if (process.env.NODE_ENV !== "production") return;
  if (registry[MARKER]) return;
  registry[MARKER] = true;

  const original = console.error.bind(console);

  console.error = (...args: unknown[]): void => {
    let line: unknown;
    try {
      line = redact(format(...args));
    } catch {
      // An argument that throws while it is inspected. Never fall back to the
      // raw arguments: that would print what this wrapper exists to remove.
      line = UNPRINTABLE;
    }
    original(line);
  };
};
