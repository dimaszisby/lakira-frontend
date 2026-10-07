/**
 * @jest-environment node
 */

import { REDACTED } from "@/lib/logger";

import type { ScrubbableEvent } from "../scrub";
import { scrubSentryEvent, scrubStrings, scrubText, stripQuery } from "../scrub";

const RESET_PATH = "/reset-password";
const DASHBOARD_PATH = "/dashboard";

describe("stripQuery", () => {
  it.each([
    [`${RESET_PATH}?token=abc`, RESET_PATH],
    ["/invites/accept?token=abc&org=1", "/invites/accept"],
    ["https://app.example/verify-email?token=abc#top", "https://app.example/verify-email"],
    [`${DASHBOARD_PATH}#section`, DASHBOARD_PATH],
    [DASHBOARD_PATH, DASHBOARD_PATH],
  ])("%s -> %s", (input, expected) => {
    expect(stripQuery(input)).toBe(expected);
  });
});

// Built at runtime: a literal in this shape is what the secret scan looks for.
const FAKE_JWT = ["eyJ" + "a".repeat(12), "b".repeat(12), "c".repeat(12)].join(".");

describe("scrubText", () => {
  it("stays linear on a long run that holds no address", () => {
    // Without the lookbehind the address pattern retries from every character:
    // 196 ms on 16 KB, so half a minute on this. The bound is loose on purpose.
    const started = performance.now();
    scrubText("a".repeat(200_000));

    expect(performance.now() - started).toBeLessThan(1_000);
  });

  it("replaces each of several addresses that share a line", () => {
    expect(scrubText("to a@b.co,c@d.io and <e.f+g@mail.example.org>")).toBe(
      "to [email],[email] and <[email]>",
    );
  });

  it("masks an email address", () => {
    expect(scrubText("No user ada@example.com in org")).toBe("No user [email] in org");
  });

  it("drops a query string embedded in a message", () => {
    expect(scrubText(`GET https://app.example${RESET_PATH}?token=abc&x=1 failed`)).toBe(
      `GET https://app.example${RESET_PATH} failed`,
    );
  });

  it("keeps a stack frame's line and column when dropping its query", () => {
    expect(scrubText("at onClick (https://app.example/chunk.js?v=123:10:20)")).toBe(
      "at onClick (https://app.example/chunk.js:10:20)",
    );
  });

  it("redacts a bearer value and a bare token of that shape", () => {
    expect(scrubText(`Authorization: Bearer ${FAKE_JWT}`)).toBe(
      `Authorization: Bearer ${REDACTED}`,
    );
    expect(scrubText(`token was ${FAKE_JWT}.`)).toBe(`token was ${REDACTED}.`);
  });

  it("does not mistake a Firefox or Safari stack frame for an email address", () => {
    const frames = "onClick@app.js:1:2\nrender@https://app.example/chunk.js:10:20\n@app.js:3:4";
    expect(scrubText(frames)).toBe(frames);
  });

  it("leaves ordinary text alone", () => {
    const stack = "TypeError: x is undefined\n    at render (/app/src/page.tsx:12:3)";
    expect(scrubText(stack)).toBe(stack);
    expect(scrubText("Is this right? Yes.")).toBe("Is this right? Yes.");
  });
});

describe("scrubStrings", () => {
  it("scrubs every string at depth and leaves other values as they are", () => {
    expect(
      scrubStrings({ a: "ada@example.com", b: [1, "x@y.co"], c: { d: null, e: true } }),
    ).toEqual({ a: "[email]", b: [1, "[email]"], c: { d: null, e: true } });
  });
});

describe("scrubSentryEvent", () => {
  it("scrubs the message and each exception value", () => {
    const event = scrubSentryEvent({
      message: "client.error: failed for ada@example.com",
      exception: { values: [{ value: `GET ${RESET_PATH}?token=abc failed` }, {}] },
    });

    expect(event.message).toBe("client.error: failed for [email]");
    expect(event.exception?.values).toEqual([{ value: `GET ${RESET_PATH} failed` }, {}]);
  });

  it("redacts credential headers and keeps the others", () => {
    const event = scrubSentryEvent({
      request: {
        headers: { authorization: "Bearer abc", cookie: "session=abc", accept: "text/html" },
      },
    });

    expect(event.request?.headers).toEqual({
      authorization: REDACTED,
      cookie: REDACTED,
      accept: "text/html",
    });
  });

  it("removes cookies and the query string, and strips the query from the url", () => {
    const event = scrubSentryEvent({
      request: {
        url: `https://app.example${RESET_PATH}?token=abc`,
        cookies: { session: "abc" },
        query_string: "token=abc",
      },
    });

    expect(event.request).toEqual({ url: `https://app.example${RESET_PATH}` });
  });

  it("redacts sensitive keys in the body, extra and contexts, at depth", () => {
    const event = scrubSentryEvent({
      request: { data: { email: "a@b.co", password: "hunter2" } },
      extra: { nested: { refreshToken: "abc", path: DASHBOARD_PATH } },
      contexts: { session: { id: "abc" }, runtime: { name: "node" } },
    });

    // `redact` scrubs strings as well as keys, so an address in a body goes too.
    expect(event.request?.data).toEqual({ email: "[email]", password: REDACTED });
    expect(event.extra).toEqual({ nested: { refreshToken: REDACTED, path: DASHBOARD_PATH } });
    expect(event.contexts).toEqual({ session: REDACTED, runtime: { name: "node" } });
  });

  it("returns an event with nothing to scrub unchanged", () => {
    const event: ScrubbableEvent & { message: string } = { message: "boom" };
    expect(scrubSentryEvent(event)).toEqual({ message: "boom" });
  });
});
