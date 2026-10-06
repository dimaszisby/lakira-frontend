import type { NextConfig } from "next";

const apiOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_API_BASE_URL
      ? new URL(process.env.NEXT_PUBLIC_API_BASE_URL).origin
      : "";
  } catch {
    return "";
  }
})();

const connectSources = ["'self'"];
if (apiOrigin) connectSources.push(apiOrigin);

/**
 * The policy for what `src/proxy.ts` does not handle: route handlers and Next's
 * static output. Pages get theirs from the proxy, with a per-request nonce for
 * script (ADR-0026, `src/lib/csp.ts`); sending this one on a page as well would
 * make the browser enforce both.
 *
 * Nothing served from these paths is a document that runs inline script, so
 * script is `'self'` only. Keep the other directives in step with `src/lib/csp.ts`,
 * which this file cannot import: it runs before the app's module graph exists.
 */
const staticContentSecurityPolicy = {
  key: "Content-Security-Policy",
  value: [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob:",
    `connect-src ${connectSources.join(" ")}`,
    "font-src 'self' https://fonts.gstatic.com data:",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "report-uri /api/security/csp-report",
  ].join("; "),
};

const securityHeaders = [
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      { source: "/api/:path*", headers: [staticContentSecurityPolicy] },
      { source: "/_next/:path*", headers: [staticContentSecurityPolicy] },
    ];
  },
};

export default nextConfig;
