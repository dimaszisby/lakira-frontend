/**
 * @jest-environment node
 */

import type * as RouteModule from "../route";

const ENDPOINT = "http://localhost:3000/api/observability/client-error";
const REPORT = JSON.stringify({ kind: "uncaught", message: "boom" });

describe("POST /api/observability/client-error", () => {
  let stdout: jest.SpyInstance;
  let POST: typeof RouteModule.POST;

  const post = (body: string, userAgent = "jest") =>
    POST(
      new Request(ENDPOINT, {
        method: "POST",
        body,
        headers: { "content-type": "application/json", "user-agent": userAgent },
      }),
    );

  const lines = (): Record<string, unknown>[] =>
    stdout.mock.calls.map(([line]) => JSON.parse(String(line)) as Record<string, unknown>);

  beforeEach(() => {
    stdout = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    // The route holds its budget in module scope; load a fresh copy per test.
    jest.isolateModules(() => {
      ({ POST } = jest.requireActual<typeof RouteModule>("../route"));
    });
  });

  afterEach(() => {
    stdout.mockRestore();
  });

  it("logs a report at error, with the fields the sink turns into tags", async () => {
    const response = await post(
      JSON.stringify({
        kind: "uncaught",
        message: "boom",
        stack: "Error: boom\n  at onClick",
        requestId: "req-123",
        digest: "digest-1",
        path: "/dashboard",
      }),
    );

    expect(response.status).toBe(204);
    expect(lines()).toEqual([
      expect.objectContaining({
        level: "error",
        msg: "client.error",
        kind: "uncaught",
        message: "boom",
        stack: "Error: boom\n  at onClick",
        requestId: "req-123",
        digest: "digest-1",
        path: "/dashboard",
        userAgent: "jest",
      }),
    ]);
  });

  it("drops a report with an unknown kind", async () => {
    const response = await post(JSON.stringify({ kind: "made-up", message: "boom" }));

    expect(response.status).toBe(204);
    expect(lines()).toEqual([]);
  });

  it("drops a field past its cap rather than truncating it into the log", async () => {
    await post(JSON.stringify({ message: "boom", requestId: "x".repeat(129) }));

    expect(lines()).toEqual([]);
  });

  it("drops an oversized body without parsing it", async () => {
    // Every known field is within its cap and unknown keys are stripped, so the
    // schema would accept this. Only the body limit stops it.
    const response = await post(JSON.stringify({ message: "boom", padding: "p".repeat(9_000) }));

    expect(response.status).toBe(204);
    expect(lines()).toEqual([]);
  });

  it("drops malformed JSON without a log line", async () => {
    const response = await post("{not json");

    expect(response.status).toBe(204);
    expect(lines()).toEqual([]);
  });

  it("drops a body that is under the cap in characters and over it in bytes", async () => {
    // 1,000 + 3,000 characters, inside both field caps and under 8,192 in all.
    // The stack is three bytes a character, which takes the body past the cap.
    const body = JSON.stringify({ message: "m".repeat(1_000), stack: "€".repeat(3_000) });
    expect(body.length).toBeLessThan(8_192);

    const response = await post(body);

    expect(response.status).toBe(204);
    expect(lines()).toEqual([]);
  });

  it("scrubs an address and a query out of the line it writes", async () => {
    await post(
      JSON.stringify({
        message: "No account for ada@example.com",
        stack: "Error: at https://app.example/reset-password?token=abc123:10:20",
        path: "/reset-password?token=abc123",
      }),
    );

    expect(lines()).toEqual([
      expect.objectContaining({
        message: "No account for [email]",
        stack: "Error: at https://app.example/reset-password:10:20",
        path: "/reset-password",
      }),
    ]);
    expect(String(stdout.mock.calls[0][0])).not.toMatch(/ada@example\.com|abc123/);
  });

  it("writes no line past sixty reports in a minute, and still answers 204", async () => {
    for (let sent = 0; sent < 60; sent += 1) await post(REPORT);
    expect(lines()).toHaveLength(60);

    const response = await post(REPORT);

    expect(response.status).toBe(204);
    expect(lines()).toHaveLength(60);
  });
});
