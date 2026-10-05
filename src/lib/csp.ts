/**
 * The Content Security Policy for page responses.
 *
 * Script is allowed by a per-request nonce, never by `'unsafe-inline'`
 * (ADR-0026). `src/proxy.ts` generates the nonce and sends this policy on both
 * the response and the forwarded request: Next reads the nonce from the
 * *request's* policy and stamps it on every script it emits. The root layout
 * reads {@link NONCE_HEADER} for the one inline script Next does not own.
 *
 * Until 2026-10-05 the policy was a static header with
 * `script-src 'self' 'unsafe-inline'`, which lets an injected inline script run
 * and so stops none.
 *
 * `/api` and `/_next` do not pass through the proxy and keep a static policy
 * from `next.config.ts`. Keep the two in step when a directive changes.
 */

/** Request header that carries the nonce to Server Components. The name is Next's convention. */
export const NONCE_HEADER = "x-nonce";

export const CSP_HEADER = "Content-Security-Policy";

/** A fresh, unguessable value for one response. Never reuse one. */
export const createNonce = (): string => btoa(crypto.randomUUID());

/** The origin of a URL, or `""` when there is none to add. */
export const originOf = (url: string | undefined | null): string => {
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
};

type PolicyInput = {
  nonce: string;
  /** Development needs `'unsafe-eval'`: React uses `eval` to rebuild server error stacks. */
  isDev: boolean;
  /** Extra origin for `connect-src`; `""` for none. */
  apiOrigin: string;
};

export const buildContentSecurityPolicy = ({ nonce, isDev, apiOrigin }: PolicyInput): string => {
  // `'strict-dynamic'` lets a nonced script load the chunks it needs. Browsers
  // that understand it ignore `'self'`, which stays for the ones that do not.
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  if (isDev) scriptSrc.push("'unsafe-eval'");

  const connectSrc = ["'self'"];
  if (apiOrigin) connectSrc.push(apiOrigin);

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    // Inline styles stay allowed: React style attributes and next/font need
    // them. Narrower than script, and recorded in ADR-0026.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob:",
    `connect-src ${connectSrc.join(" ")}`,
    "font-src 'self' https://fonts.gstatic.com data:",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "report-uri /api/security/csp-report",
  ].join("; ");
};
