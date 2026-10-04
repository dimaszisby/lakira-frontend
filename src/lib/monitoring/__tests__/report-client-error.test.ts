import {
  MAX_REPORTS_PER_PAGE_LOAD,
  reportClientError,
  resetClientErrorReports,
} from "../report-client-error";

const ENDPOINT = "/api/observability/client-error";
const REJECTION = "unhandled-rejection";

const sentBodies = (mock: jest.Mock): Record<string, unknown>[] =>
  mock.mock.calls.map(
    ([, init]) => JSON.parse(String((init as RequestInit).body)) as Record<string, unknown>,
  );

describe("reportClientError", () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    resetClientErrorReports();
    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    window.history.replaceState(null, "", "/reset-password?token=abc");
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("posts the message, stack, kind and page path to the app's own endpoint", () => {
    const error = new Error("boom");

    reportClientError(error, "uncaught");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(ENDPOINT);
    expect(sentBodies(fetchMock)[0]).toMatchObject({
      kind: "uncaught",
      message: "boom",
      stack: error.stack,
    });
  });

  it("sends the path without its query string", () => {
    reportClientError(new Error("boom"), "boundary");

    const [body] = sentBodies(fetchMock);
    expect(body.path).toBe("/reset-password");
    expect(JSON.stringify(body)).not.toContain("token=abc");
  });

  it("carries the digest of a server-rendered error", () => {
    reportClientError(Object.assign(new Error("boom"), { digest: "digest-1" }), "boundary");

    expect(sentBodies(fetchMock)[0].digest).toBe("digest-1");
  });

  it("reads the backend's request id from an Axios-shaped error", () => {
    const error = Object.assign(new Error("Request failed"), {
      response: { status: 500, headers: { "x-request-id": "req-123" } },
    });

    reportClientError(error, REJECTION);

    expect(sentBodies(fetchMock)[0].requestId).toBe("req-123");
  });

  it("reads the request id from an already-normalized error", () => {
    reportClientError({ message: "Server error", requestId: "req-456" }, REJECTION);

    expect(sentBodies(fetchMock)[0]).toMatchObject({
      message: "Server error",
      requestId: "req-456",
    });
  });

  it("reports a rejection with a non-Error reason", () => {
    reportClientError("plain string reason", REJECTION);

    expect(sentBodies(fetchMock)[0].message).toBe("plain string reason");
  });

  it("skips cancelled requests", () => {
    reportClientError(new DOMException("aborted", "AbortError"), REJECTION);
    reportClientError(Object.assign(new Error("canceled"), { name: "CanceledError" }), "uncaught");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports the same failure once when a boundary and the listener both see it", () => {
    const error = new Error("boom");

    reportClientError(error, "boundary");
    reportClientError(error, "uncaught");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("treats two errors with one digest as the same failure", () => {
    // A boundary can receive Next's generic production message for a server
    // error while the listener sees another; the digest is what they share.
    reportClientError(Object.assign(new Error("generic"), { digest: "digest-1" }), "boundary");
    reportClientError(Object.assign(new Error("specific"), { digest: "digest-1" }), "uncaught");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops after the per-page-load cap", () => {
    for (let i = 0; i < MAX_REPORTS_PER_PAGE_LOAD + 3; i += 1) {
      reportClientError(new Error(`boom ${i}`), "uncaught");
    }

    expect(fetchMock).toHaveBeenCalledTimes(MAX_REPORTS_PER_PAGE_LOAD);
  });

  it("caps an oversized message and stack", () => {
    const error = new Error("m".repeat(5_000));
    error.stack = "s".repeat(10_000);

    reportClientError(error, "uncaught");

    const [body] = sentBodies(fetchMock);
    expect(String(body.message)).toHaveLength(1_024);
    expect(String(body.stack)).toHaveLength(4_000);
  });

  it("never throws, even when fetch does", () => {
    fetchMock.mockImplementation(() => {
      throw new Error("offline");
    });

    expect(() => reportClientError(new Error("boom"), "uncaught")).not.toThrow();
  });
});
