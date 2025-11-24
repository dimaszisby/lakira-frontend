const SESSION_ENDPOINT = "/api/auth/session";

export async function persistSessionToken(token: string | null) {
  try {
    if (token) {
      await fetch(SESSION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    } else {
      await fetch(SESSION_ENDPOINT, { method: "DELETE" });
    }
  } catch (error) {
    // Non-blocking: log only in development
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to sync session cookie", error);
    }
  }
}
