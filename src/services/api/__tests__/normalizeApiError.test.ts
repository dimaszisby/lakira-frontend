import type { AxiosResponse } from "axios";
import { AxiosError } from "axios";

import { normalizeApiError } from "@/services/api/normalizeApiError";

const REQUEST_FAILED = "Request failed with status code";

const axiosError = ({
  status,
  data,
  code,
  message = REQUEST_FAILED,
}: {
  status?: number;
  data?: unknown;
  code?: string;
  message?: string;
}) =>
  new AxiosError(
    message,
    code,
    undefined,
    undefined,
    status === undefined ? undefined : ({ status, data } as AxiosResponse),
  );

describe("normalizeApiError", () => {
  it("classifies an aborted request as a non-retryable cancellation", () => {
    const result = normalizeApiError(new DOMException("aborted", "AbortError"));

    expect(result).toMatchObject({
      isAbort: true,
      title: "Canceled",
      messages: [],
      retryable: false,
    });
  });

  it("collects messages from every supported envelope, in order", () => {
    const data = {
      message: "Top-level message",
      errors: ["String error", { message: "Object error" }, { path: "name" }, 42],
      error: "Error field",
      issues: [{ message: "Zod issue" }, "ignored"],
    };

    const result = normalizeApiError(axiosError({ status: 422, data }));

    expect(result.messages).toEqual([
      "Top-level message",
      "String error",
      "Object error",
      "Error field",
      "Zod issue",
    ]);
    expect(result).toMatchObject({ isAbort: false, status: 422, title: "Validation error" });
  });

  it.each([
    [400, "Request error", false],
    [401, "Unauthorized", false],
    [403, "Forbidden", false],
    [404, "Not Found", false],
    [409, "Conflict", false],
    [429, "Rate limited", true],
    [500, "Server error", true],
    [503, "Server error", true],
  ])("maps status %i to %s (retryable: %s)", (status, title, retryable) => {
    const result = normalizeApiError(axiosError({ status, data: { message: "x" } }));

    expect(result.title).toBe(title);
    expect(result.retryable).toBe(retryable);
  });

  it("treats a missing response as a retryable network error", () => {
    const result = normalizeApiError(axiosError({ code: "ECONNABORTED", message: "timeout" }));

    expect(result).toMatchObject({
      status: undefined,
      code: "ECONNABORTED",
      title: "Network error",
      messages: ["timeout"],
      retryable: true,
    });
  });

  it("falls back to the axios message when the body has no messages", () => {
    const result = normalizeApiError(axiosError({ status: 500, data: "<html>oops</html>" }));

    expect(result.messages).toEqual([REQUEST_FAILED]);
  });

  it("falls back to a generic message when axios has none", () => {
    const result = normalizeApiError(axiosError({ status: 500, data: {}, message: "" }));

    expect(result.messages).toEqual(["Request failed"]);
  });

  it("wraps a plain Error without marking it retryable", () => {
    const error = new Error("Boom");

    expect(normalizeApiError(error)).toEqual({
      isAbort: false,
      title: "Unexpected error",
      messages: ["Boom"],
      retryable: false,
      raw: error,
    });
  });

  it("describes a thrown non-Error value generically", () => {
    expect(normalizeApiError("nope").messages).toEqual(["Unexpected error"]);
  });
});
