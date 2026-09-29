// Runs in Node, inside cypress.config.ts tasks: no `cy` here.
//
// The one place that knows what the backend's emails look like (cypress-a11y-e2e D-05). The API
// contract check does not cover email templates, so when the backend changes one, this file is the
// only edit, and the error below names the email it could not read.

export type MailKind = "verify" | "invite" | "reset";

const MAIL: Record<MailKind, { subject: RegExp; link: RegExp }> = {
  // Matched on wording, not the brand name, so a renamed fork still matches.
  verify: { subject: /verify your .* email/i, link: /\/verify-email\?token=([^\s&"<]+)/ },
  invite: { subject: /invited to join/i, link: /\/invites\/accept\?token=([^\s&"<]+)/ },
  reset: { subject: /reset your .* password/i, link: /\/reset-password\?token=([^\s&"<]+)/ },
};

type MessageSummary = { ID: string; Subject: string };

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 15_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Mailpit answered ${response.status} for ${url}`);
  return (await response.json()) as T;
};

/**
 * The newest token of `kind` sent to `email`. Polls, because mail arrives a moment after the API
 * responds (lakira-backend docs/how-to/development/read-outbound-email.md).
 */
export const tokenFromMailpit = async (
  mailpitUrl: string,
  email: string,
  kind: MailKind,
): Promise<string> => {
  const { subject, link } = MAIL[kind];
  const query = encodeURIComponent(`to:"${email}"`);
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const { messages } = await getJson<{ messages: MessageSummary[] }>(
      `${mailpitUrl}/api/v1/search?query=${query}`,
    );
    const hit = messages.find((message) => subject.test(message.Subject));
    if (hit) {
      const { Text } = await getJson<{ Text: string }>(`${mailpitUrl}/api/v1/message/${hit.ID}`);
      const match = link.exec(Text);
      if (!match) {
        throw new Error(
          `Found the ${kind} email to ${email} ("${hit.Subject}") but no link matching ${String(link)}. ` +
            "The backend's template changed: update cypress/support/mailpit.ts.",
        );
      }
      return decodeURIComponent(match[1]);
    }
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    `No ${kind} email to ${email} with a subject matching ${String(subject)} arrived in Mailpit ` +
      `within ${POLL_TIMEOUT_MS / 1000}s. If the email arrived under another subject, the backend's ` +
      "template changed: update cypress/support/mailpit.ts.",
  );
};

/** Whether `url` answers at all, for the stack preflight. */
export const probe = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    return response.ok ? "up" : `answered ${response.status}`;
  } catch (error) {
    return `unreachable (${error instanceof Error ? error.message : String(error)})`;
  }
};
