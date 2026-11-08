/**
 * The browser's address, as the reverse proxy in front of the app reported it (ADR-0049).
 *
 * The backend rate-limits by client address. Every browser call reaches it through
 * the API proxy, so unless the proxy says who the caller is, the backend sees this
 * server's address for every user and they all share one budget.
 *
 * A route handler cannot read the socket, so `X-Forwarded-For` is the only source.
 * Its rightmost entry is the one written by the hop directly in front of the app:
 * the backend's reverse proxy, which is the only hop (ADR-0047). Whether that proxy
 * replaces a browser-sent value or appends to it, its client entry is last, and an
 * entry a browser put before it is ignored. With nothing in front, Next fills the
 * header with the socket address only when it is missing, so a browser that reaches
 * the server directly chooses its own entry. That is why the container is reached
 * only through the reverse proxy (`docs/reference/production-image.md`).
 *
 * Node runtime only, for `node:net`: `src/proxy.ts` runs on the edge and must not import it.
 */
import { isIP } from "node:net";

export const clientAddress = (headers: Headers): string | null => {
  // Several header lines arrive joined with ", ", so the last line's last entry is still last.
  const forwardedFor = headers.get("x-forwarded-for");
  if (!forwardedFor) return null;

  const last = forwardedFor.split(",").at(-1)?.trim() ?? "";
  // Anything that is not a bare address is not forwarded: the backend then sees
  // this server, the old shared budget, rather than a value someone chose. A
  // zone id (`fe80::1%eth0`) passes `isIP` with any suffix, and a client address
  // never carries one.
  return isIP(last) === 0 || last.includes("%") ? null : last;
};
