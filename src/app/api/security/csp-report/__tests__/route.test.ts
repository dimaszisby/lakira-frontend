/**
 * @jest-environment node
 */

import type * as RouteModule from "../route";

const ENDPOINT = "http://localhost:3000/api/security/csp-report";
const VIOLATION_MSG = "csp.violation";
const DIRECTIVE = "script-src-elem";
const REPORT = JSON.stringify({
  "csp-report": {
    "document-uri": "https://app.example/login",
    "violated-directive": DIRECTIVE,
    "blocked-uri": "inline",
    "line-number": 12,
  },
});

describe("POST /api/security/csp-report", () => {
  let stdout: jest.SpyInstance;
  let POST: typeof RouteModule.POST;

  const post = (body: string) =>
    POST(new Request(ENDPOINT, { method: "POST", body, headers: { "user-agent": "jest" } }));

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

  it("logs a CSP Level 2 report at warn, reduced to the diagnostic fields", async () => {
    const response = await post(REPORT);

    expect(response.status).toBe(204);
    expect(lines()).toEqual([
      expect.objectContaining({
        level: "warn",
        msg: VIOLATION_MSG,
        documentUri: "https://app.example/login",
        violatedDirective: DIRECTIVE,
        blockedUri: "inline",
        lineNumber: 12,
        userAgent: "jest",
      }),
    ]);
  });

  it("reads the Reporting API's field names too", async () => {
    await post(
      JSON.stringify({ documentURL: "https://app.example/", effectiveDirective: DIRECTIVE }),
    );

    expect(lines()).toEqual([
      expect.objectContaining({
        msg: VIOLATION_MSG,
        documentUri: "https://app.example/",
        violatedDirective: DIRECTIVE,
      }),
    ]);
  });

  it("scrubs a token out of the reported page address", async () => {
    await post(
      JSON.stringify({
        "csp-report": { "document-uri": "https://app.example/reset-password?token=abc123" },
      }),
    );

    expect(lines()).toEqual([
      expect.objectContaining({ documentUri: "https://app.example/reset-password" }),
    ]);
    expect(String(stdout.mock.calls[0][0])).not.toContain("abc123");
  });

  it("truncates a long field and drops one that is not a string or a number", async () => {
    await post(
      JSON.stringify({
        "csp-report": {
          "source-file": "s".repeat(600),
          "blocked-uri": { nested: "x".repeat(600) },
          "violated-directive": ["a", "b"],
        },
      }),
    );

    const [line] = lines();
    expect(line.sourceFile).toBe(`${"s".repeat(512)}...`);
    expect(line).not.toHaveProperty("blockedUri");
    expect(line).not.toHaveProperty("violatedDirective");
  });

  it("logs an oversized report as one short line, without its content", async () => {
    const response = await post(JSON.stringify({ "csp-report": { padding: "p".repeat(9_000) } }));

    expect(response.status).toBe(204);
    expect(lines()).toEqual([
      expect.objectContaining({ level: "warn", msg: "csp.report.oversized", maxBytes: 8_192 }),
    ]);
    expect(String(stdout.mock.calls[0][0]).length).toBeLessThan(200);
  });

  it.each([
    ["malformed JSON", "{not json"],
    ["a body that is not an object", JSON.stringify(["a"])],
  ])("logs %s as invalid, without a stack", async (_label, body) => {
    const response = await post(body);

    expect(response.status).toBe(204);
    const [line, ...rest] = lines();
    expect(rest).toEqual([]);
    expect(line).toMatchObject({ level: "warn", msg: "csp.report.invalid" });
    expect(line).not.toHaveProperty("error");
  });

  it("writes no line past sixty reports in a minute, whatever their kind", async () => {
    for (let sent = 0; sent < 30; sent += 1) await post(REPORT);
    for (let sent = 0; sent < 30; sent += 1) await post("{not json");
    expect(lines()).toHaveLength(60);

    const response = await post(REPORT);
    await post("{not json");
    await post(JSON.stringify({ padding: "p".repeat(9_000) }));

    expect(response.status).toBe(204);
    expect(lines()).toHaveLength(60);
  });
});
