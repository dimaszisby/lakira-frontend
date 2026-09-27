const SESSION_ENDPOINT = "/api/auth/session";

/**
 * Write or clear the session cookie through `/api/auth/session`.
 *
 * Resolves `true` when the server accepted the write. Login and register ignore
 * the result; switching organization cannot, because by then the backend has
 * already moved the refresh cookie to the new organization.
 */
export async function persistSessionToken(token: string | null): Promise<boolean> {
  try {
    const response = token
      ? await fetch(SESSION_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
      : await fetch(SESSION_ENDPOINT, { method: "DELETE" });
    return response.ok;
  } catch (error) {
    // Non-blocking: log only in development
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to sync session cookie", error);
    }
    return false;
  }
}
