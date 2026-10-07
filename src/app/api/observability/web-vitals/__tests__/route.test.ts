/**
 * @jest-environment node
 */

import type * as RouteModule from "../route";

const ENDPOINT = "http://localhost:3000/api/observability/web-vitals";
const BEACON = JSON.stringify({ name: "LCP", value: 1234.56, rating: "good", path: "/login" });

describe("POST /api/observability/web-vitals", () => {
  let stdout: jest.SpyInstance;
  let POST: typeof RouteModule.POST;

  const post = (body: string) => POST(new Request(ENDPOINT, { method: "POST", body }));

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

  it("logs a beacon at info, reduced to known fields", async () => {
    const response = await post(BEACON);

    expect(response.status).toBe(204);
    expect(lines()).toEqual([
      expect.objectContaining({
        level: "info",
        msg: "web-vital",
        metric: "LCP",
        value: 1235,
        rating: "good",
        path: "/login",
      }),
    ]);
  });

  it("keeps four decimal places for CLS, where a millisecond rounding would lose it", async () => {
    await post(JSON.stringify({ name: "CLS", value: 0.123456 }));

    expect(lines()).toEqual([expect.objectContaining({ metric: "CLS", value: 0.1235 })]);
  });

  it("drops a beacon that fails the schema, without a log line", async () => {
    const response = await post(JSON.stringify({ name: "LCP", value: "fast" }));

    expect(response.status).toBe(204);
    expect(lines()).toEqual([]);
  });

  it("drops a body that is under the cap in characters and over it in bytes", async () => {
    // Unknown keys are stripped, so the schema would accept this. 700 characters
    // of three bytes each pass the 2,048-byte cap.
    const body = JSON.stringify({ name: "LCP", value: 1, padding: "€".repeat(700) });
    expect(body.length).toBeLessThan(2_048);

    const response = await post(body);

    expect(response.status).toBe(204);
    expect(lines()).toEqual([]);
  });

  it("writes no line past six hundred beacons in a minute, and still answers 204", async () => {
    for (let sent = 0; sent < 600; sent += 1) await post(BEACON);
    expect(lines()).toHaveLength(600);

    const response = await post(BEACON);

    expect(response.status).toBe(204);
    expect(lines()).toHaveLength(600);
  });
});
