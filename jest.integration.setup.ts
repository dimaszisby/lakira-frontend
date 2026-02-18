import { ReadableStream, TransformStream, WritableStream } from "node:stream/web";
import { TextDecoder, TextEncoder } from "node:util";

Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
  ReadableStream,
  TransformStream,
  WritableStream,
});

if (!globalThis.BroadcastChannel) {
  class BroadcastChannelMock {
    name: string;

    constructor(name: string) {
      this.name = name;
    }

    postMessage() {}

    close() {}

    addEventListener() {}

    removeEventListener() {}

    dispatchEvent() {
      return false;
    }
  }

  globalThis.BroadcastChannel = BroadcastChannelMock as unknown as typeof BroadcastChannel;
}

const { Blob, File, FormData, Headers, Request, Response, fetch } = require(
  "next/dist/compiled/@edge-runtime/primitives/fetch.js",
);

Object.assign(globalThis, {
  fetch,
  Headers,
  Request,
  Response,
  FormData,
  Blob,
  File,
});

type IntegrationMswServer = {
  listen: (options?: { onUnhandledRequest?: "bypass" | "error" | "warn" }) => void;
  resetHandlers: () => void;
  close: () => void;
};

const { server } = require("@/src/test-utils/msw/server") as { server: IntegrationMswServer };

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
