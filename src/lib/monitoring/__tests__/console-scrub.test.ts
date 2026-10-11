/**
 * @jest-environment node
 */

import { inspect } from "node:util";

import { MAX_STRING_LENGTH } from "@/lib/logger";

import { scrubConsoleErrors, UNPRINTABLE } from "../console-scrub";

const MARKER = Symbol.for("lakira.console.scrubbed");

const ADDRESS = "jane.doe@example.com";
const TOKEN_QUERY = "?token=abc123secret";
const BEARER_VALUE = "abcdef0123456789abcdef";
const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature";
const MESSAGE = `probe failed for ${ADDRESS} at /reset${TOKEN_QUERY} with Bearer ${BEARER_VALUE} and ${JWT}`;

const setNodeEnv = (value: string): void => {
  Object.assign(process.env, { NODE_ENV: value });
};

describe("scrubConsoleErrors", () => {
  const originalNodeEnv = process.env.NODE_ENV ?? "test";
  let written: jest.Mock;
  let savedError: typeof console.error;

  beforeEach(() => {
    savedError = console.error;
    written = jest.fn();
    console.error = written;
    delete (globalThis as Record<symbol, unknown>)[MARKER];
    setNodeEnv("production");
  });

  afterEach(() => {
    console.error = savedError;
    delete (globalThis as Record<symbol, unknown>)[MARKER];
    setNodeEnv(originalNodeEnv);
  });

  const printed = (): string => {
    expect(written).toHaveBeenCalledTimes(1);
    const args = written.mock.calls[0] as unknown[];
    expect(args).toHaveLength(1);
    return String(args[0]);
  };

  it("prints an error without the address, the query, the bearer value or the token", () => {
    scrubConsoleErrors();

    console.error("⨯", new Error(MESSAGE));

    const line = printed();
    expect(line).not.toContain(ADDRESS);
    expect(line).not.toContain("abc123secret");
    expect(line).not.toContain(BEARER_VALUE);
    expect(line).not.toContain(JWT);
    expect(line).toContain("⨯ Error: probe failed for [email] at /reset with Bearer [redacted]");
  });

  it("scrubs a plain string the same way", () => {
    scrubConsoleErrors();

    console.error(`request to /invites/accept${TOKEN_QUERY} by ${ADDRESS} failed`);

    expect(printed()).toBe("request to /invites/accept by [email] failed");
  });

  it("scrubs a value substituted into a format string", () => {
    scrubConsoleErrors();

    console.error("%s failed for %s", "invite", ADDRESS, `Bearer ${BEARER_VALUE}`);

    expect(printed()).toBe("invite failed for [email] Bearer [redacted]");
  });

  it("cuts a line past the logger's limit", () => {
    scrubConsoleErrors();

    console.error("x".repeat(MAX_STRING_LENGTH + 500));

    expect(printed()).toBe(`${"x".repeat(MAX_STRING_LENGTH)}...`);
  });

  it("prints a placeholder, not the arguments, when one cannot be formatted", () => {
    scrubConsoleErrors();
    const hostile = {
      [inspect.custom]: (): string => {
        throw new Error(`inspect failed for ${ADDRESS}`);
      },
    };

    expect(() => console.error(ADDRESS, hostile)).not.toThrow();

    expect(printed()).toBe(UNPRINTABLE);
  });

  it("leaves the error that was thrown as it was", () => {
    scrubConsoleErrors();
    const error = new Error(MESSAGE);
    const stackBefore = error.stack;

    console.error(error);

    expect(error.message).toBe(MESSAGE);
    expect(error.stack).toBe(stackBefore);
  });

  it("wraps once when called twice", () => {
    scrubConsoleErrors();
    const wrapped = console.error;

    scrubConsoleErrors();

    expect(console.error).toBe(wrapped);
    expect(wrapped).not.toBe(written);
  });

  it("does not replace console.error outside production", () => {
    setNodeEnv("development");

    scrubConsoleErrors();

    expect(console.error).toBe(written);
  });
});
