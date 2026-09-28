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

/**
 * Store a freshly issued token as the session, or fail.
 *
 * For login and register, which must not send the user into the app without a
 * session cookie: the app would render signed in, then fail on its first
 * request. Throwing here fails the mutation instead, so the form shows its
 * error and stays put. A missing token is a failure too; the contract requires
 * one on both responses.
 */
export async function establishSession(token: string | undefined): Promise<void> {
  if (!token || !(await persistSessionToken(token))) {
    throw new Error("The session could not be stored.");
  }
}
