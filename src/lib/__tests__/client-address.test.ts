/**
 * @jest-environment node
 */

import { clientAddress } from "@/lib/client-address";

const FORWARDED_FOR = "x-forwarded-for";
const REPORTED = "203.0.113.7";
const withForwardedFor = (value: string) => new Headers({ [FORWARDED_FOR]: value });

describe("clientAddress", () => {
  it("reads the address the reverse proxy wrote", () => {
    expect(clientAddress(withForwardedFor(REPORTED))).toBe(REPORTED);
  });

  it("reads the rightmost entry, so one a browser put before it is ignored", () => {
    expect(clientAddress(withForwardedFor(`198.51.100.9, ${REPORTED}`))).toBe(REPORTED);
  });

  it("trims the space around an entry", () => {
    expect(clientAddress(withForwardedFor(`198.51.100.9 ,  ${REPORTED}  `))).toBe(REPORTED);
  });

  it("reads the last entry of the last line when the header arrives on several lines", () => {
    const headers = new Headers();
    headers.append(FORWARDED_FOR, "198.51.100.9");
    headers.append(FORWARDED_FOR, `198.51.100.10, ${REPORTED}`);

    expect(clientAddress(headers)).toBe(REPORTED);
  });

  it("accepts IPv6, in either case, including an IPv4-mapped address", () => {
    expect(clientAddress(withForwardedFor("2001:db8::1"))).toBe("2001:db8::1");
    expect(clientAddress(withForwardedFor("2001:DB8::1"))).toBe("2001:DB8::1");
    expect(clientAddress(withForwardedFor("::ffff:127.0.0.1"))).toBe("::ffff:127.0.0.1");
  });

  it.each([
    ["an empty last entry", `${REPORTED}, `],
    ["an unknown client", "unknown"],
    ["an address with a port", `${REPORTED}:51234`],
    ["a bracketed IPv6 address", "[2001:db8::1]"],
    ["an IPv6 address with a zone id", "fe80::1%eth0"],
    ["a hostname", "client.example.com"],
  ])("returns null for %s", (_, value) => {
    expect(clientAddress(withForwardedFor(value))).toBeNull();
  });

  it("returns null when there is no header", () => {
    expect(clientAddress(new Headers())).toBeNull();
  });
});
