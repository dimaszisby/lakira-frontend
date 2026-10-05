// Helpers for cypress/e2e/stack/: specs that need the backend and Mailpit, run locally with
// `npm run test:e2e:stack` and never in CI (cypress-a11y-e2e D-01).

import type { MailKind } from "./mailpit";

export type StackUser = { email: string; username: string; password: string };

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const START_HINT = [
  "Start the local stack, then run again:",
  "  backend and Mailpit: docker compose -f ../lakira-backend/docker-compose.yml up -d",
  "  app: npm run dev",
  "See docs/how-to/testing/run-stack-e2e.md.",
].join("\n");

const exposed = (key: "backendUrl" | "mailpitUrl"): string => String(Cypress.expose(key));

const stackUrls = () => ({
  app: Cypress.config("baseUrl") ?? "",
  backend: exposed("backendUrl"),
  mailpit: exposed("mailpitUrl"),
});

/**
 * These specs create accounts. Refuse anything but a local host for every URL they touch, so a
 * stray environment variable cannot point them at staging.
 */
export const assertLocalStack = (urls = stackUrls()): void => {
  for (const [name, url] of Object.entries(urls)) {
    const host = URL.canParse(url) ? new URL(url).hostname : "";
    if (!LOCAL_HOSTS.has(host)) {
      throw new Error(
        `Refusing to run stack specs: the ${name} URL "${url}" is not a local host. ` +
          "They create accounts, so they only run against the local Docker stack.",
      );
    }
  }
};

/** Fails once, before any spec, naming whatever is not running. */
export const preflightStack = (): void => {
  const urls = stackUrls();
  assertLocalStack(urls);

  const checks: [string, string][] = [
    ["app", `${urls.app}/login`],
    ["backend", `${urls.backend}/health`],
    ["Mailpit", `${urls.mailpit}/api/v1/info`],
  ];
  const down: string[] = [];
  for (const [name, url] of checks) {
    cy.task<string>("probe", url, { log: false }).then((status) => {
      if (status !== "up") down.push(`  ${name} at ${url}: ${status}`);
    });
  }
  cy.wrap(down, { log: false }).then(() => {
    if (down.length > 0) {
      throw new Error(
        ["The local stack is not fully running:", ...down, "", START_HINT].join("\n"),
      );
    }
  });
};

let sequence = 0;

/** A fresh user; each run creates its own (D-05). */
export const newUser = (role: string): StackUser => {
  const id = `${Date.now()}${sequence++}`;
  return {
    email: `e2e-${role}-${id}@example.com`,
    username: `e2e${role}${id}`,
    password: "e2e-stack-password",
  };
};

export const registerUser = (user: StackUser): void => {
  cy.request("POST", "/api/proxy/auth/register", {
    ...user,
    passwordConfirmation: user.password,
    isPublicProfile: false,
  });
};

/**
 * Signs in the way the app does: the proxy's login. Its response sets the session cookie and
 * carries no token (ADR-0025), which this asserts on every sign-in of every stack spec.
 */
export const signIn = (user: Pick<StackUser, "email" | "password">): void => {
  cy.request("POST", "/api/proxy/auth/login", {
    email: user.email,
    password: user.password,
  }).then(({ body }) => {
    expect(JSON.stringify(body)).not.to.match(/"token"/);
  });
};

/** `signIn`, cached per user across the tests of one spec. */
export const signInSession = (user: StackUser): void => {
  cy.session(user.email, () => signIn(user), {
    validate: () => {
      cy.request("/api/proxy/auth/profile");
    },
  });
};

/** The newest token of `kind` emailed to `email`, read from Mailpit (cypress/support/mailpit.ts). */
export const tokenFor = (email: string, kind: MailKind): Cypress.Chainable<string> =>
  cy.task<string>("mailpitToken", { email, kind }, { log: false });
