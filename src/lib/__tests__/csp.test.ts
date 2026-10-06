/**
 * @jest-environment node
 *
 * `createNonce` uses the Web Crypto global, which the proxy has and jsdom does not.
 */

import nextConfig from "../../../next.config";
import { buildContentSecurityPolicy, createNonce, NONCE_HEADER } from "../csp";

const directive = (policy: string, name: string): string[] => {
  const found = policy
    .split(";")
    .map((part) => part.trim())
    .find((part) => part === name || part.startsWith(`${name} `));
  return found ? found.split(/\s+/).slice(1) : [];
};

const NONCE = "abc123";
const SCRIPT_SRC = "script-src";
const UNSAFE_INLINE = "'unsafe-inline'";
const production = buildContentSecurityPolicy({ nonce: NONCE, isDev: false, apiOrigin: "" });
const development = buildContentSecurityPolicy({ nonce: NONCE, isDev: true, apiOrigin: "" });

describe("buildContentSecurityPolicy", () => {
  it("allows script by nonce and strict-dynamic, never inline (ADR-0026)", () => {
    const scriptSrc = directive(production, SCRIPT_SRC);

    expect(scriptSrc).toEqual(["'self'", `'nonce-${NONCE}'`, "'strict-dynamic'"]);
    expect(scriptSrc).not.toContain(UNSAFE_INLINE);
  });

  it("adds unsafe-eval in development only, which React needs there", () => {
    expect(directive(development, SCRIPT_SRC)).toContain("'unsafe-eval'");
    expect(directive(production, SCRIPT_SRC)).not.toContain("'unsafe-eval'");
    expect(directive(development, SCRIPT_SRC)).not.toContain(UNSAFE_INLINE);
  });

  it("keeps the directives the static policy had", () => {
    expect(directive(production, "default-src")).toEqual(["'self'"]);
    expect(directive(production, "img-src")).toEqual(["'self'", "data:", "blob:"]);
    expect(directive(production, "font-src")).toEqual([
      "'self'",
      "https://fonts.gstatic.com",
      "data:",
    ]);
    expect(directive(production, "style-src")).toEqual([
      "'self'",
      UNSAFE_INLINE,
      "https://fonts.googleapis.com",
    ]);
    expect(directive(production, "frame-ancestors")).toEqual(["'self'"]);
    expect(directive(production, "base-uri")).toEqual(["'self'"]);
    expect(directive(production, "form-action")).toEqual(["'self'"]);
    expect(directive(production, "report-uri")).toEqual(["/api/security/csp-report"]);
  });

  it("forbids plugins outright", () => {
    expect(directive(production, "object-src")).toEqual(["'none'"]);
  });

  it("adds the API origin to connect-src when there is one", () => {
    expect(directive(production, "connect-src")).toEqual(["'self'"]);

    const withApi = buildContentSecurityPolicy({
      nonce: NONCE,
      isDev: false,
      apiOrigin: "https://api.example.test",
    });
    expect(directive(withApi, "connect-src")).toEqual(["'self'", "https://api.example.test"]);
  });

  it("is a single line with no stray separators", () => {
    expect(production).not.toMatch(/[\r\n]/);
    expect(production).not.toMatch(/;;|; ;/);
  });
});

describe("createNonce", () => {
  it("is different every time", () => {
    const seen = new Set(Array.from({ length: 50 }, () => createNonce()));
    expect(seen.size).toBe(50);
  });

  it("uses only characters that are safe inside a header and an attribute", () => {
    expect(createNonce()).toMatch(/^[A-Za-z0-9+/=_-]{16,}$/);
  });
});

describe("NONCE_HEADER", () => {
  it("is the name Next's guide and the root layout agree on", () => {
    expect(NONCE_HEADER).toBe("x-nonce");
  });
});

describe("the static policy in next.config.ts", () => {
  // Route handlers and Next's static output do not pass through the proxy, so
  // they get a policy from next.config.ts, which cannot import the builder: it
  // runs before the app's module graph exists. The two are written out twice,
  // and this is what notices when only one of them is edited.
  type HeaderRule = { source: string; headers: { key: string; value: string }[] };

  const rules = async (): Promise<HeaderRule[]> => (await nextConfig.headers?.()) ?? [];

  const staticPolicies = async () =>
    (await rules())
      .map((rule) => ({
        source: rule.source,
        policy: rule.headers.find((header) => header.key === "Content-Security-Policy")?.value,
      }))
      .filter((rule): rule is { source: string; policy: string } => Boolean(rule.policy));

  const split = (policy: string) =>
    Object.fromEntries(
      policy.split(";").map((part) => {
        const [name, ...values] = part.trim().split(/\s+/);
        return [name, values.join(" ")];
      }),
    );

  it("is sent only where the proxy does not run, so no page gets two policies", async () => {
    expect((await staticPolicies()).map((rule) => rule.source).sort()).toEqual([
      "/_next/:path*",
      "/api/:path*",
    ]);
  });

  it("matches the page policy in every directive except script-src", async () => {
    const page = split(production);
    for (const { policy } of await staticPolicies()) {
      const fixed = split(policy);
      expect(Object.keys(fixed).sort()).toEqual(Object.keys(page).sort());
      for (const name of Object.keys(page).filter((key) => key !== SCRIPT_SRC)) {
        expect(fixed[name]).toBe(page[name]);
      }
    }
  });

  it("allows script from this origin only, with nothing inline", async () => {
    for (const { policy } of await staticPolicies()) {
      expect(split(policy)[SCRIPT_SRC]).toBe("'self'");
    }
  });
});
