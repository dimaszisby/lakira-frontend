# Run the stack E2E specs

`cypress/e2e/stack/` holds the specs that need the real backend: the signed-in pages checked for
accessibility in both themes, the invite-and-switch journey, the password reset, and the metrics
list at four widths in both list modes. CI cannot run
them, because it has no backend, so they run on your machine. Run them when a change touches a
signed-in page, the app layout, or an auth or token flow, and before a release
(`.claude/rules/workflow.md`, gate table).

## 1. Start the backend and Mailpit

From this repository, with `lakira-backend` checked out beside it:

```bash
docker compose -f ../lakira-backend/docker-compose.yml up -d
```

That starts the API on `:8001`, its database, Redis, RabbitMQ and Mailpit on `:8025`. The Compose
`app` service always sends mail to Mailpit, whatever the backend's `.env` says (lakira-backend
`docs/how-to/development/read-outbound-email.md`).

If the backend container predates a change you need, rebuild it: add `--build mailpit app`.

## 2. Start the app

Either the dev server:

```bash
npm run dev
```

or what CI runs, which is closer to production:

```bash
npm run build && npm run start
```

A dev server that has been running since before a dependency change still serves the old code
from memory. Restart it after `npm install`.

## 3. Run the specs

```bash
npm run test:e2e:stack
```

The specs check the stack first and stop with one message naming anything that is not running, and
how to start it. They create fresh users each run (`e2e-<role>-<number>@example.com`) and read every
token from Mailpit; nothing needs to be seeded, and nothing is stored.

## Point it elsewhere

| Variable           | Default                        |
| ------------------ | ------------------------------ |
| `CYPRESS_BASE_URL` | `http://127.0.0.1:3000`        |
| `E2E_BACKEND_URL`  | `http://localhost:8001/api/v1` |
| `E2E_MAILPIT_URL`  | `http://localhost:8025`        |

All three must be local hosts. The specs create accounts, so they refuse any other address before
sending a request.

## When it fails

- **"The local stack is not fully running"**: start what it names.
- **"No verify email to … arrived in Mailpit"**, or **"Found the … email … but no link"**: the
  backend changed an email's subject or link. Update the patterns in
  `cypress/support/mailpit.ts`; nothing else knows about them.
- **An accessibility violation** prints the rule, the element and axe's reason, colours and ratio
  included. Fix it, or, if it is genuinely exempt, add an exclusion to
  `cypress/support/a11y.ts` that cites the ADR or WCAG criterion.
- **429 responses**: the backend rate-limits registration and sign-in. Its `.env.example` ships
  `DISABLE_RATE_LIMITING=false` and allows `true` "only for local testing / fuzzing"; the specs were
  written against a local backend with it set to `true`. With limits on, repeated runs may be
  throttled. Registration is the tightest: 10 per hour per IP (`RATE_LIMIT_REGISTER_IP_MAX`,
  since backend #127), and every run registers fresh users, so a second run within the hour can
  fail with "Too many registration attempts". `DISABLE_RATE_LIMITING=true` switches it off too.
