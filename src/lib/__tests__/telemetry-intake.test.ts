/**
 * @jest-environment node
 *
 * The intake logs through the logger, which no-ops where `window` is defined,
 * and reads a request body as a stream, which jsdom's `Request` does not offer.
 */

import { createTelemetryIntake, TELEMETRY_SUPPRESSED_MSG } from "../telemetry-intake";

const ENDPOINT = "http://localhost:3000/api/observability/client-error";
const EVENT = "client.error";
const TOO_LARGE = { ok: false, reason: "too-large" };
const OVER_BUDGET = { ok: false, reason: "over-budget" };
const CHUNK_BYTES = 1_024;

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request(ENDPOINT, { method: "POST", body, headers });

/** A body that never ends, so only a cancel stops it. Counts what was asked of it. */
const endlessBody = (headers: Record<string, string> = {}) => {
  const seen = { pulls: 0, cancelled: false };
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      seen.pulls += 1;
      controller.enqueue(new Uint8Array(CHUNK_BYTES).fill(97));
    },
    cancel() {
      seen.cancelled = true;
    },
  });
  // `duplex` is required by Node for a streamed request body and is not in the DOM types.
  const init = { method: "POST", body, headers, duplex: "half" } as RequestInit;
  return { request: new Request(ENDPOINT, init), seen };
};

describe("createTelemetryIntake", () => {
  let stdout: jest.SpyInstance;
  let time: number;
  const now = () => time;

  const lines = (): Record<string, unknown>[] =>
    stdout.mock.calls.map(([line]) => JSON.parse(String(line)) as Record<string, unknown>);

  beforeEach(() => {
    time = 1_000_000;
    stdout = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdout.mockRestore();
  });

  it("returns the parsed body when it is inside the cap and the budget", async () => {
    const intake = createTelemetryIntake({ event: EVENT, maxBytes: 1_000, perMinute: 5, now });

    expect(await intake(post(JSON.stringify({ message: "boom" })))).toEqual({
      ok: true,
      json: { message: "boom" },
    });
    expect(lines()).toEqual([]);
  });

  it("refuses a body that is under the cap in characters and over it in bytes", async () => {
    const intake = createTelemetryIntake({ event: EVENT, maxBytes: 1_000, perMinute: 5, now });
    const body = JSON.stringify({ message: "é".repeat(600) });
    expect(body.length).toBeLessThan(1_000);
    expect(new TextEncoder().encode(body).byteLength).toBeGreaterThan(1_000);

    expect(await intake(post(body))).toEqual(TOO_LARGE);
  });

  it("accepts a multi-byte body that is inside the cap, decoded intact", async () => {
    const intake = createTelemetryIntake({ event: EVENT, maxBytes: 1_000, perMinute: 5, now });

    expect(await intake(post(JSON.stringify({ message: "é".repeat(100) })))).toEqual({
      ok: true,
      json: { message: "é".repeat(100) },
    });
  });

  it("refuses a body on its declared length without reading it", async () => {
    const intake = createTelemetryIntake({ event: EVENT, maxBytes: 4_096, perMinute: 5, now });
    const { request, seen } = endlessBody({ "content-length": "9000" });

    expect(await intake(request)).toEqual(TOO_LARGE);
    expect(seen.cancelled).toBe(true);
    // The stream fills its own one-chunk queue before anyone reads; nothing more.
    expect(seen.pulls).toBeLessThanOrEqual(1);
  });

  it("cancels a body that declares no length once it passes the cap", async () => {
    const intake = createTelemetryIntake({ event: EVENT, maxBytes: 4_096, perMinute: 5, now });
    const { request, seen } = endlessBody();

    expect(await intake(request)).toEqual(TOO_LARGE);
    expect(seen.cancelled).toBe(true);
    // Five chunks pass the cap; allow the stream its one queued chunk beyond that.
    expect(seen.pulls).toBeLessThanOrEqual(4_096 / CHUNK_BYTES + 2);
  });

  it("does not trust a declared length that understates the body", async () => {
    const intake = createTelemetryIntake({ event: EVENT, maxBytes: 4_096, perMinute: 5, now });
    const { request, seen } = endlessBody({ "content-length": "10" });

    expect(await intake(request)).toEqual(TOO_LARGE);
    expect(seen.cancelled).toBe(true);
  });

  it("reports malformed JSON and an empty body as malformed", async () => {
    const intake = createTelemetryIntake({ event: EVENT, maxBytes: 1_000, perMinute: 5, now });
    const malformed = { ok: false, reason: "malformed" };

    expect(await intake(post("{not json"))).toEqual(malformed);
    expect(await intake(new Request(ENDPOINT, { method: "POST" }))).toEqual(malformed);
  });

  it("reads no body and writes no line when the budget is spent", async () => {
    const intake = createTelemetryIntake({ event: EVENT, maxBytes: 4_096, perMinute: 2, now });
    await intake(post("{}"));
    await intake(post("{}"));

    const { request, seen } = endlessBody();
    expect(await intake(request)).toEqual(OVER_BUDGET);
    expect(seen.cancelled).toBe(true);
    expect(seen.pulls).toBeLessThanOrEqual(1);
    expect(lines()).toEqual([]);
  });

  it("writes one suppressed line, with the count, after a window that dropped requests", async () => {
    const intake = createTelemetryIntake({ event: EVENT, maxBytes: 1_000, perMinute: 1, now });
    await intake(post("{}"));
    expect(await intake(post("{}"))).toEqual(OVER_BUDGET);
    expect(await intake(post("{}"))).toEqual(OVER_BUDGET);
    expect(lines()).toEqual([]);

    time += 60_000;
    expect(await intake(post("{}"))).toEqual({ ok: true, json: {} });
    expect(lines()).toEqual([
      expect.objectContaining({
        level: "warn",
        msg: TELEMETRY_SUPPRESSED_MSG,
        event: EVENT,
        dropped: 2,
      }),
    ]);

    // The next window dropped nothing, so it adds no line.
    time += 60_000;
    await intake(post("{}"));
    expect(lines()).toHaveLength(1);
  });
});
