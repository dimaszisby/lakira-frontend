/**
 * @jest-environment node
 */

// The Lighthouse gate's signed-in session (ADR-0046, #176): which routes a run measures, the
// local-host guard, the cookie handed to Lighthouse, and how sign-in survives a dropped
// connection. The rest of the network half is proved by the performance job itself, whose
// redirect check fails a route that lost its session.
import {
  assertLocalUrl,
  describeFetchError,
  extraHeadersArg,
  routesToMeasure,
  sessionCookieFrom,
  signIn,
} from "../../scripts/perf/signed-in-session";

const SIGNED_IN = ["/dashboard", "/metrics"];
const SESSION = "lakira_token=session-value";
const CONFIG = { lighthouse: { routes: ["/", "/login"], signedInRoutes: SIGNED_IN } };

describe("routesToMeasure", () => {
  it("measures the signed-in routes after the public ones when not skipped", () => {
    expect(routesToMeasure(CONFIG, false)).toEqual({
      publicRoutes: ["/", "/login"],
      signedInRoutes: SIGNED_IN,
      skippedRoutes: [],
    });
  });

  it("skips the signed-in routes when public only", () => {
    expect(routesToMeasure(CONFIG, true)).toEqual({
      publicRoutes: ["/", "/login"],
      signedInRoutes: [],
      skippedRoutes: SIGNED_IN,
    });
  });

  it("measures no signed-in route when none is configured", () => {
    expect(routesToMeasure({ lighthouse: { routes: ["/"] } }, false).signedInRoutes).toEqual([]);
  });
});

describe("assertLocalUrl", () => {
  it.each(["http://127.0.0.1:3000", "http://localhost:3000", "http://[::1]:3000"])(
    "accepts %s",
    (url) => {
      expect(() => assertLocalUrl(url)).not.toThrow();
    },
  );

  it.each(["https://lakira-staging.example.com", "http://10.0.0.5:3000", "not a url"])(
    "refuses %s, since the run registers an account",
    (url) => {
      expect(() => assertLocalUrl(url)).toThrow(/not a local host/);
    },
  );
});

describe("sessionCookieFrom", () => {
  it("returns the session cookie's name and value without its attributes", () => {
    const setCookies = [
      "lakira_refresh=refresh-value; Path=/api; HttpOnly; Secure; SameSite=Strict",
      `${SESSION}; Path=/; HttpOnly; Secure; SameSite=Lax`,
    ];
    expect(sessionCookieFrom(setCookies)).toBe(SESSION);
  });

  it("throws when sign-in set no session cookie", () => {
    expect(() => sessionCookieFrom(["lakira_refresh=refresh-value; Path=/api"])).toThrow(
      /no lakira_token cookie/,
    );
  });

  it("throws when the session cookie is set empty, as a sign-out does", () => {
    expect(() => sessionCookieFrom(["lakira_token=; Path=/; Max-Age=0"])).toThrow(
      /no lakira_token cookie/,
    );
  });
});

describe("extraHeadersArg", () => {
  it("passes the cookie as a Cookie header in Lighthouse's JSON form", () => {
    const arg = extraHeadersArg(SESSION);
    expect(arg.startsWith("--extra-headers=")).toBe(true);
    expect(JSON.parse(arg.slice("--extra-headers=".length))).toEqual({
      Cookie: SESSION,
    });
  });
});

describe("describeFetchError", () => {
  it("names the cause that fetch failed hides", () => {
    const cause = Object.assign(new Error("other side closed"), { code: "UND_ERR_SOCKET" });
    expect(describeFetchError(new TypeError("fetch failed", { cause }))).toBe(
      "fetch failed (UND_ERR_SOCKET: other side closed)",
    );
  });

  it("returns the message alone when there is no cause", () => {
    expect(describeFetchError(new Error("boom"))).toBe("boom");
  });
});

describe("signIn", () => {
  const APP = "http://127.0.0.1:3000";
  const USER = { email: "perf@example.com", password: "perf-run-password" };
  const signedIn = () =>
    new Response("{}", { status: 200, headers: { "Set-Cookie": `${SESSION}; Path=/` } });
  const dropped = () => new TypeError("fetch failed", { cause: new Error("other side closed") });

  const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();
  const realFetch = global.fetch;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = realFetch;
  });

  it("retries once when the connection drops, as an idle kept-alive one can", async () => {
    fetchMock.mockRejectedValueOnce(dropped()).mockResolvedValueOnce(signedIn());
    await expect(signIn(APP, USER)).resolves.toBe(SESSION);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("names the cause when the retry drops too", async () => {
    fetchMock.mockRejectedValueOnce(dropped()).mockRejectedValueOnce(dropped());
    await expect(signIn(APP, USER)).rejects.toThrow(
      "POST /auth/login failed twice: fetch failed (other side closed)",
    );
  });

  it("does not retry when the backend answers with an error", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 401 }));
    await expect(signIn(APP, USER)).rejects.toThrow("POST /auth/login answered 401.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
