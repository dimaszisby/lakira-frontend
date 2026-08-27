import type { HttpHandler } from "msw";

/**
 * Global MSW handlers — intentionally empty.
 *
 * The server runs with `onUnhandledRequest: "error"`, and each integration test
 * declares exactly the requests it expects via `server.use()`. That is stricter
 * than a shared handler list: a test cannot pass while silently relying on a
 * response it never declared, and an unexpected request fails loudly instead of
 * being quietly served.
 *
 * Verified 2026-08-27: 11 of 16 integration suites call `server.use()`; the
 * other 5 are layout components that make no network calls. None mocks a
 * feature hook at module level.
 *
 * **Add a handler here only** for a request every integration test would
 * otherwise have to repeat. Adding one weakens the guarantee above, so prefer
 * `server.use()` in the test that needs it.
 */
export const handlers: HttpHandler[] = [];
