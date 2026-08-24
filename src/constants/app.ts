/**
 * Application identity — the single place this app is named.
 *
 * `scripts/bootstrap-fork.sh` rewrites these values when a fork is renamed, so
 * prefer importing from here over writing a brand string inline.
 *
 * Two brand strings live outside this module and cannot import it:
 *
 * - `public/scripts/theme-init.js` duplicates {@link THEME_STORAGE_KEY}. It is a
 *   blocking inline script served as static JS with no module system, so the key
 *   has to be literal there. Change both together.
 * - `package.json` `"name"`.
 *
 * The fork script keeps all three in sync. If you edit a value here by hand,
 * edit them there too.
 */

/** Display name, used in metadata titles and visible chrome. */
export const APP_NAME = "Lakira";

/** One-line product description, used as the default meta description. */
export const APP_DESCRIPTION =
  "Track and monitor your progress seamlessly. Set goals, view trends, and stay motivated!";

/** Separator between a page title and {@link APP_NAME}, via the Metadata title template. */
export const TITLE_SEPARATOR = "·";

/**
 * Name of the httpOnly session cookie.
 *
 * Renaming this signs out every existing session exactly once, because the
 * browser still holds the old cookie under the old name and nothing reads it.
 */
export const SESSION_COOKIE_NAME = "lakira_token";

/**
 * Attributes for the session cookie.
 *
 * Every route that sets *or clears* the cookie must use these. A clear that
 * omits an attribute the setter used can leave the cookie in place, which is
 * how a "logged out" session stays live.
 *
 * `secure: true` is unconditional and deliberate — the cookie will not be set
 * over plain HTTP, including localhost. Work around that in development with
 * the documented setup rather than by weakening the flag.
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: true,
  path: "/",
} as const;

/** Session lifetime in seconds (7 days). */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** localStorage key for the persisted theme. Mirrored in `public/scripts/theme-init.js`. */
export const THEME_STORAGE_KEY = "lakira.theme";
