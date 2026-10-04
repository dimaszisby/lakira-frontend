/**
 * @jest-environment node
 */

import type { LogEntry } from "@/lib/logger";

import { CLIENT_ERROR_MSG, CLIENT_REPORTS_PER_MINUTE, createSentrySink } from "../sentry-sink";

const TIME = "2026-10-04T00:00:00.000Z";
const SERVER_ERROR_MSG = "server.request_error";
const UNREACHABLE_MSG = "proxy.upstream_unreachable";

const entry = (fields: Partial<LogEntry> & { msg: string }): LogEntry => ({
  level: "error",
  time: TIME,
  ...fields,
});

const setup = (startAt = 1_000_000) => {
  let clock = startAt;
  const reporter = { captureException: jest.fn(), captureMessage: jest.fn() };
  const write = jest.fn();
  const sink = createSentrySink(reporter, { now: () => clock, write });
  return {
    reporter,
    write,
    sink,
    advance: (ms: number) => {
      clock += ms;
    },
  };
};

describe("createSentrySink", () => {
  it("writes every entry to stdout, whatever its level", () => {
    const { sink, write } = setup();

    sink(entry({ level: "info", msg: "proxy.refreshed" }));
    sink(entry({ level: "warn", msg: "proxy.unauthenticated" }));
    sink(entry({ msg: SERVER_ERROR_MSG }));

    expect(write).toHaveBeenCalledTimes(3);
  });

  it("forwards error entries only", () => {
    const { sink, reporter } = setup();

    sink(entry({ level: "debug", msg: "a" }));
    sink(entry({ level: "info", msg: "b" }));
    sink(entry({ level: "warn", msg: "c" }));
    expect(reporter.captureMessage).not.toHaveBeenCalled();
    expect(reporter.captureException).not.toHaveBeenCalled();

    sink(entry({ msg: UNREACHABLE_MSG }));
    expect(reporter.captureMessage).toHaveBeenCalledTimes(1);
  });

  it("sends requestId and digest as tags, under the names the backend uses", () => {
    const { sink, reporter } = setup();

    sink(entry({ msg: CLIENT_ERROR_MSG, message: "boom", requestId: "req-1", digest: "d-1" }));

    expect(reporter.captureMessage).toHaveBeenCalledWith(
      `${CLIENT_ERROR_MSG}: boom`,
      expect.objectContaining({
        level: "error",
        tags: { msg: CLIENT_ERROR_MSG, requestId: "req-1", digest: "d-1" },
      }),
    );
  });

  it("rebuilds an Error from a redacted server error so the stack survives", () => {
    const { sink, reporter } = setup();

    sink(
      entry({
        msg: SERVER_ERROR_MSG,
        error: { name: "TypeError", message: "x is undefined", stack: "TypeError: x\n  at f" },
      }),
    );

    const [error] = reporter.captureException.mock.calls[0] as [Error];
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("TypeError");
    expect(error.message).toBe("x is undefined");
    expect(error.stack).toBe("TypeError: x\n  at f");
  });

  it("sends a browser report as a message, with its stack in extra", () => {
    // Browser stacks are not in V8's format outside Chrome, and the Node SDK
    // parses nothing else, so rebuilding an Error would give frames to some
    // browsers and none to others.
    const { sink, reporter } = setup();

    sink(entry({ msg: CLIENT_ERROR_MSG, message: "boom", stack: "onClick@app.js:1:2" }));

    expect(reporter.captureException).not.toHaveBeenCalled();
    const [title, hint] = reporter.captureMessage.mock.calls[0] as [string, { extra: LogEntry }];
    expect(title).toBe(`${CLIENT_ERROR_MSG}: boom`);
    expect(hint.extra.stack).toBe("onClick@app.js:1:2");
  });

  it("fingerprints a message by event, kind and text, so different errors stay apart", () => {
    // Found by sending real reports: without this, Sentry grouped every browser
    // error into one issue, because they are all captured from the same line.
    const { sink, reporter } = setup();

    sink(entry({ msg: CLIENT_ERROR_MSG, kind: "uncaught", message: "first" }));
    sink(entry({ msg: CLIENT_ERROR_MSG, kind: "uncaught", message: "second" }));
    sink(entry({ msg: UNREACHABLE_MSG }));

    const fingerprints = reporter.captureMessage.mock.calls.map(
      ([, hint]) => (hint as { fingerprint: string[] }).fingerprint,
    );
    expect(fingerprints).toEqual([
      [CLIENT_ERROR_MSG, "uncaught", "first"],
      [CLIENT_ERROR_MSG, "uncaught", "second"],
      [UNREACHABLE_MSG, "", ""],
    ]);
  });

  it("leaves a rebuilt server error to group by its own stack", () => {
    const { sink, reporter } = setup();

    sink(
      entry({ msg: SERVER_ERROR_MSG, error: { name: "Error", message: "x", stack: "Error: x" } }),
    );

    const [, hint] = reporter.captureException.mock.calls[0] as [Error, { fingerprint?: string[] }];
    expect(hint.fingerprint).toBeUndefined();
  });

  it("scrubs free text before it is forwarded", () => {
    const { sink, reporter } = setup();

    sink(
      entry({
        msg: CLIENT_ERROR_MSG,
        message: "failed for ada@example.com",
        stack: "at f (https://app.example/reset-password?token=abc:1:2)",
      }),
    );
    sink(
      entry({
        msg: SERVER_ERROR_MSG,
        error: {
          name: "Error",
          message: "no user ada@example.com",
          stack: "Error: ada@example.com",
        },
      }),
    );

    const [title, hint] = reporter.captureMessage.mock.calls[0] as [string, { extra: LogEntry }];
    expect(title).toBe(`${CLIENT_ERROR_MSG}: failed for [email]`);
    expect(hint.extra.message).toBe("failed for [email]");
    expect(hint.extra.stack).toBe("at f (https://app.example/reset-password:1:2)");

    const [error, serverHint] = reporter.captureException.mock.calls[0] as [
      Error,
      { extra: { error: { message: string } } },
    ];
    expect(error.message).toBe("no user [email]");
    expect(error.stack).toBe("Error: [email]");
    expect(serverHint.extra.error.message).toBe("no user [email]");
  });

  it("strips the query string from path and url fields", () => {
    const { sink, reporter } = setup();

    sink(entry({ msg: CLIENT_ERROR_MSG, path: "/reset-password?token=abc" }));

    const [, hint] = reporter.captureMessage.mock.calls[0] as [string, { extra: LogEntry }];
    expect(hint.extra.path).toBe("/reset-password");
  });

  it("forwards client reports up to the cap, then keeps them on stdout only", () => {
    const { sink, reporter, write } = setup();

    for (let i = 0; i < CLIENT_REPORTS_PER_MINUTE + 5; i += 1) {
      sink(entry({ msg: CLIENT_ERROR_MSG, message: `boom ${i}` }));
    }

    expect(reporter.captureMessage).toHaveBeenCalledTimes(CLIENT_REPORTS_PER_MINUTE);
    expect(write).toHaveBeenCalledTimes(CLIENT_REPORTS_PER_MINUTE + 5);
  });

  it("opens the cap again after a minute", () => {
    const { sink, reporter, advance } = setup();

    for (let i = 0; i < CLIENT_REPORTS_PER_MINUTE + 1; i += 1) {
      sink(entry({ msg: CLIENT_ERROR_MSG, message: `boom ${i}` }));
    }
    advance(60_000);
    sink(entry({ msg: CLIENT_ERROR_MSG, message: "later" }));

    expect(reporter.captureMessage).toHaveBeenCalledTimes(CLIENT_REPORTS_PER_MINUTE + 1);
  });

  it("does not cap server errors", () => {
    const { sink, reporter } = setup();

    for (let i = 0; i < CLIENT_REPORTS_PER_MINUTE + 5; i += 1) {
      sink(entry({ msg: UNREACHABLE_MSG }));
    }

    expect(reporter.captureMessage).toHaveBeenCalledTimes(CLIENT_REPORTS_PER_MINUTE + 5);
  });

  it("never throws when the reporter does", () => {
    const { sink, reporter, write } = setup();
    reporter.captureMessage.mockImplementation(() => {
      throw new Error("sentry is down");
    });

    expect(() => sink(entry({ msg: UNREACHABLE_MSG }))).not.toThrow();
    expect(write).toHaveBeenCalledTimes(1);
  });
});
