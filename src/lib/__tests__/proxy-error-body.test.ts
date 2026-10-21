import type { AxiosResponse } from "axios";
import { AxiosError } from "axios";

import { filterErrorBody } from "@/lib/proxy-error-body";
import { normalizeApiError } from "@/services/api/normalizeApiError";

const VALIDATION_FAILED = "Validation failed";
const SESSION_EXPIRED = { error: "Session expired", code: "SESSION_EXPIRED" };

const filtered = (body: unknown): unknown => {
  const result = filterErrorBody(JSON.stringify(body));
  return result === null ? null : JSON.parse(result);
};

/** What the UI reads from a body, through the same function it uses. */
const asTheUiReadsIt = (status: number, data: unknown) => {
  const n = normalizeApiError(
    new AxiosError("Request failed", undefined, undefined, undefined, {
      status,
      data,
    } as AxiosResponse),
  );
  return { messages: n.messages, serverCode: n.serverCode, hasServerMessage: n.hasServerMessage };
};

describe("filterErrorBody", () => {
  it("keeps the backend's envelope and drops its stack", () => {
    const body = {
      status: "fail",
      message: "Invalid email or password",
      stack: "Error: Invalid email or password\n    at LoginUser.execute (/app/src/…)",
    };

    expect(filtered(body)).toEqual({ status: "fail", message: "Invalid email or password" });
  });

  it("drops a key it does not know, so a new backend field is inert until listed", () => {
    expect(filtered({ message: "Not found", query: "SELECT * FROM users", internalId: 7 })).toEqual(
      { message: "Not found" },
    );
  });

  it("reduces each field issue to its field and message", () => {
    const body = {
      status: "fail",
      message: VALIDATION_FAILED,
      errors: [
        { field: "body.name", message: "Required", received: "undefined", path: ["name"] },
        "A plain string issue",
        { message: "No field" },
        { field: "body.colour" },
        42,
        null,
      ],
    };

    expect(filtered(body)).toEqual({
      status: "fail",
      message: VALIDATION_FAILED,
      errors: [
        { field: "body.name", message: "Required" },
        "A plain string issue",
        { message: "No field" },
      ],
    });
  });

  it("reduces Zod-shaped issues to their messages", () => {
    const body = {
      issues: [{ code: "too_small", path: ["name"], message: "Too short" }, { code: "custom" }],
    };

    expect(filtered(body)).toEqual({ issues: [{ message: "Too short" }] });
  });

  it("keeps the proxy's own session code, and drops values that are not strings", () => {
    expect(filtered(SESSION_EXPIRED)).toEqual(SESSION_EXPIRED);
    expect(filtered({ message: { nested: "object" }, code: 401, errors: "not an array" })).toEqual(
      {},
    );
  });

  it("answers an object with nothing it knows as an empty object", () => {
    expect(filtered({ stack: "Error: …" })).toEqual({});
  });

  it.each([
    ["HTML from a gateway", "<html><body>502 Bad Gateway</body></html>"],
    ["plain text", "Bad Gateway"],
    ["an empty string", ""],
    ["an array", '[{"message":"x"}]'],
    ["a string", '"oops"'],
    ["a number", "500"],
    ["null", "null"],
  ])("returns null for %s, which is not a JSON object", (_label, text) => {
    expect(filterErrorBody(text)).toBeNull();
  });

  // The allowlist must be a superset of what the UI reads, or a message vanishes. Each fixture
  // is one envelope `normalizeApiError` understands, carrying keys the filter drops.
  it.each([
    ["the backend's envelope", 404, { status: "fail", message: "Metric not found", stack: "…" }],
    [
      "field issues",
      400,
      {
        status: "fail",
        message: VALIDATION_FAILED,
        errors: [{ field: "body.name", message: "Required", extra: 1 }, "Plain"],
      },
    ],
    ["Zod issues", 422, { issues: [{ path: ["a"], message: "Too short" }] }],
    ["a bare error", 409, { error: "Already a member", hint: "internal" }],
    ["the proxy's session code", 401, SESSION_EXPIRED],
  ])("leaves what the UI reads from %s unchanged", (_label, status, body) => {
    expect(asTheUiReadsIt(status, filtered(body))).toEqual(asTheUiReadsIt(status, body));
  });
});
