/**
 * @jest-environment node
 */

import { POST } from "../route";

const post = (body: string, userAgent = "jest") =>
  POST(
    new Request("http://localhost:3000/api/observability/client-error", {
      method: "POST",
      body,
      headers: { "content-type": "application/json", "user-agent": userAgent },
    }),
  );

describe("POST /api/observability/client-error", () => {
  let stdout: jest.SpyInstance;

  const lines = (): Record<string, unknown>[] =>
    stdout.mock.calls.map(([line]) => JSON.parse(String(line)) as Record<string, unknown>);

  beforeEach(() => {
    stdout = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
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
});
