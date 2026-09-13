# Claude Lessons — Lakira Frontend

Persistent record of corrections and patterns learned on this project.
Updated after any correction per `.claude/rules/workflow.md`.

<!-- Entries added below as lessons are learned. Format:
## [YYYY-MM-DD] <short title>
**Mistake**: what went wrong
**Rule**: the pattern to follow instead
**Why**: reason / context
-->

## [2026-08-17] The components layer boundary was never enforced

**Mistake**: `CLAUDE.md` documented `components → lib, utils, types, generics` as lint-enforced, and that claim went unchecked for months. `eslint.config.mjs` declares the rule under `boundaries/element-types` but never maps `src/components/**` in `settings["boundaries/elements"]`, so the rule matched nothing.

**Rule**: when a doc claims a rule is mechanically enforced, verify the mechanism before trusting it. For `eslint-plugin-boundaries` specifically, a `from: <type>` rule is inert unless `<type>` appears in `boundaries/elements`.

**Why**: an unenforced rule that is documented as enforced is worse than no rule — it stops anyone from checking by hand. Turning it on surfaced 126 violations: 108 were the *declared table* being wrong (`app` and `features` legitimately consume `components`), and 18 were genuine inversions in six files. Both had been invisible for months.

## [2026-08-17] The OpenAPI snapshot drifted 12 paths behind the backend

**Mistake**: `docs/reference/api/lakira-backend-openapi.json` was a manual copy with no drift gate. It sat at 18 paths while the backend shipped 30 — the entire multi-tenancy surface (`/organizations/*`, `/invites/accept`, `/memberships/{id}`) and most of the auth lifecycle (`/auth/refresh`, `/auth/verify-email`, `/auth/reset-password`, `/auth/switch-org`) were invisible to the frontend.

**Rule**: a copied artifact needs a check that fails in CI, not a convention that says to update it. Run `npm run api:spec:check` before trusting anything in `src/types/dtos/**`.

**Why**: manual sync always drifts; the only question is how long before someone notices.

## [2026-09-11] A styling cleanup plan swept strays without closing the door on them

**Mistake**: The first plan for the `src/components/ui` refactor listed stray colours and arbitrary values to replace one by one. It left Tailwind's default palette enabled and added no lint rule, so the next commit could reintroduce them. It also had no guardrail against a consistency pass altering the brand. The user had to raise both points separately.

**Rule**: Pair every styling sweep with a mechanism:

- only token colours exist in the Tailwind theme;
- lint arbitrary values, opacity tints and non-custom-property inline styles in shared UI;
- variant and state styling live in recipe CSS.

Treat the app's identity (palette values, brand mapping, fonts, type scale) as fixed input. A consistency pass unifies how primitives use it; it never changes it.

**Why**: A cleanup without enforcement is a snapshot, and it drifts the same way the OpenAPI copy did. A consistency pass that touches the identity is a redesign, and nobody asked for one.

## [2026-09-12] The edge session gate had never run

**Mistake**: `middleware.ts` sat at the repository root while `app` is at `src/app`, and Next 16 renamed the convention to `proxy`. Next therefore never loaded it. Four rule files, two reference docs and a C4 diagram all described it as the thing gating protected routes. It was found only by returning a marker header from it and finding the header absent from the response.

**Rule**: a gate that fails *open into another gate* produces no symptom, so prove it runs before trusting it. When a file is loaded by convention rather than by import — middleware/proxy, instrumentation, route handlers, config — the name and the directory are both part of the contract, and a framework major version can change either. Check the version's own docs in `node_modules/next/dist/docs/`, as `CLAUDE.md` says, rather than reaching for what the convention used to be.

**Why**: `src/app/(app)/layout.tsx` redirects unauthenticated users too, so the app *looked* gated. What the fallback could not do was carry a `returnUrl`, and it only runs once rendering has started. The consequence was invisible until a feature — reviving an expired session — actually depended on the gate. This is the same shape as the 2026-08-17 `boundaries` lesson: a rule documented as mechanically enforced, with nothing checking the mechanism. The matcher-sync test now reads `src/proxy.ts` by path, so a move back fails the suite.
