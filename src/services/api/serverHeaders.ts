import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/constants/app";
import { decodeJwtPayload } from "@/lib/jwt";

/**
 * Builds a Cookie header string from the active request cookies so server-side API
 * calls can reuse the user's session when hitting internal proxies.
 */
export async function getServerAuthHeaders(): Promise<Record<string, string> | undefined> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  return cookieHeader ? { Cookie: cookieHeader } : undefined;
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
