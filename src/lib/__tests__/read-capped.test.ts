/**
 * @jest-environment node
 */

import { readCapped } from "@/lib/read-capped";

// The telemetry intake's own suite covers a `Request`. These are the `Response` cases the proxy
// reads a backend error body through (ADR-0034).
describe("readCapped, on a Response", () => {
  it("returns the whole body when it is within the cap", async () => {
    await expect(readCapped(new Response('{"message":"x"}'), 64)).resolves.toBe('{"message":"x"}');
  });

  it("returns null once the streamed body passes the cap", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(40));
        controller.enqueue(new Uint8Array(40));
        controller.close();
      },
    });

    await expect(readCapped(new Response(stream), 64)).resolves.toBeNull();
  });

  it("returns null on a declared length over the cap without reading the body", async () => {
    const response = new Response("short", { headers: { "content-length": "1000" } });

    await expect(readCapped(response, 64)).resolves.toBeNull();
  });

  it("returns an empty string for a response with no body", async () => {
    await expect(readCapped(new Response(null, { status: 404 }), 64)).resolves.toBe("");
  });
});
