import { cookies, headers } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/constants/app";
import { clientAddress } from "@/lib/client-address";
import { decodeJwtPayload } from "@/lib/jwt";

/**
 * Headers for a server-side call to this app's own `/api/proxy`, from the page
 * request being rendered.
 *
 * - `Cookie`, so the call reuses the user's session.
 * - `X-Forwarded-For`, the browser's address as the reverse proxy reported it,
 *   so the prefetch counts against this user's rate-limit budget rather than
 *   this server's. The call goes over loopback (`resolveSelfOrigin`), so the
 *   proxy receives it as sent and forwards it (ADR-0050).
 *
 * `undefined` when there is neither.
 */
export async function getServerAuthHeaders(): Promise<Record<string, string> | undefined> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const address = clientAddress(await headers());

  const result: Record<string, string> = {};
  if (cookieHeader) result.Cookie = cookieHeader;
  if (address) result["X-Forwarded-For"] = address;

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * The active organization id, read from the session token.
 *
 * The server-component counterpart to `useOrganizationId()`. Server components
 * cannot use React context, so anything prefetching an org-scoped query reads
 * the claim directly.
 *
 * Returns `null` when there is no usable session. Callers must treat that as
 * "cannot scope" and skip the prefetch rather than substituting a placeholder —
 * an unscoped key would cache one tenant's data under a key that does not
 * identify it.
 */
export async function getServerOrganizationId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const organizationId = decodeJwtPayload(token)?.organizationId;
  return typeof organizationId === "string" && organizationId.length > 0 ? organizationId : null;
}
