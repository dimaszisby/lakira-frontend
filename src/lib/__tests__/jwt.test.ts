import type {JwtPayload} from "../jwt";
import { decodeJwtPayload, isJwtExpired, isSessionTokenUsable  } from "../jwt";

const base64Url = (value: object): string =>
  Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** Build a structurally valid JWT. The signature is never checked. */
const makeToken = (payload: JwtPayload): string =>
  `${base64Url({ alg: "HS256", typ: "JWT" })}.${base64Url(payload)}.notarealsignature`;

const nowSeconds = () => Math.floor(Date.now() / 1000);

describe("decodeJwtPayload", () => {
  it("reads the payload of a well-formed token", () => {
    const token = makeToken({ sub: "u_1", exp: 1893456000, role: "admin" });
    expect(decodeJwtPayload(token)).toEqual({ sub: "u_1", exp: 1893456000, role: "admin" });
  });

  it.each([
    ["an empty string", ""],
    ["a non-JWT string", "not-a-token"],
    ["two segments", "header.payload"],
    ["four segments", "a.b.c.d"],
    ["an unparseable payload", "aGVhZGVy.bm90LWpzb24.sig"],
  ])("returns null for %s", (_label, token) => {
    expect(decodeJwtPayload(token)).toBeNull();
  });

  it("returns null when the payload is a JSON array rather than an object", () => {
    expect(decodeJwtPayload(`${base64Url({})}.${base64Url([1, 2] as never)}.sig`)).toBeNull();
  });

  it("handles base64url padding variants", () => {
    // Payload lengths that require 0, 1, and 2 padding characters.
    for (const sub of ["a", "ab", "abc"]) {
      expect(decodeJwtPayload(makeToken({ sub }))).toEqual({ sub });
    }
  });
});

describe("isJwtExpired", () => {
  it("is false for a token expiring in the future", () => {
    expect(isJwtExpired(makeToken({ exp: nowSeconds() + 3600 }))).toBe(false);
  });

  it("is true for a token that has already expired", () => {
    expect(isJwtExpired(makeToken({ exp: nowSeconds() - 1 }))).toBe(true);
  });

  it("treats the exact expiry second as expired", () => {
    expect(isJwtExpired(makeToken({ exp: nowSeconds() }))).toBe(true);
  });

  // Safe direction: an unreadable token cannot be shown to be live, so the gate
  // redirects to login rather than admitting it.
  it.each([
    ["no exp claim", makeToken({ sub: "u_1" })],
    ["a non-numeric exp", makeToken({ exp: "soon" as never })],
    ["a NaN exp", makeToken({ exp: Number.NaN })],
    ["a malformed token", "garbage"],
  ])("treats %s as expired", (_label, token) => {
    expect(isJwtExpired(token)).toBe(true);
  });

  it("applies leeway for clock skew", () => {
    const justExpired = makeToken({ exp: nowSeconds() - 30 });
    expect(isJwtExpired(justExpired)).toBe(true);
    expect(isJwtExpired(justExpired, 60)).toBe(false);
  });
});

describe("isSessionTokenUsable", () => {
  it("accepts a live token", () => {
    expect(isSessionTokenUsable(makeToken({ exp: nowSeconds() + 3600 }))).toBe(true);
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["an empty string", ""],
    ["a malformed token", "nope"],
  ])("rejects %s", (_label, token) => {
    expect(isSessionTokenUsable(token)).toBe(false);
  });

  it("rejects an expired token, which the old presence-only check admitted", () => {
    expect(isSessionTokenUsable(makeToken({ exp: nowSeconds() - 10 }))).toBe(false);
  });
});
