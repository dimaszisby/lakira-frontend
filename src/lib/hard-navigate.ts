/**
 * Leave the current page with a full document load.
 *
 * Unlike `router.push`, this drops every client-side cache: TanStack Query,
 * Jotai atoms, and the App Router's cached server payloads. Use it only where
 * that is the point, such as changing the active organization.
 *
 * A module of its own so tests can mock it; jsdom does not let
 * `window.location.assign` be spied on.
 */
export const hardNavigate = (url: string): void => {
  window.location.assign(url);
};
