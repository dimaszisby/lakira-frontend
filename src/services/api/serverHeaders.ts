import { cookies } from "next/headers";

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
