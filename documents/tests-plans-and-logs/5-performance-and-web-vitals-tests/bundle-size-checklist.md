# Bundle Size Checklist – Lakira Frontend

This checklist defines how we **monitor and control bundle size** for the Lakira frontend.

It is used when:

- Introducing new dependencies or heavy features.
- Running CI checks for production builds.
- Reviewing performance before a release (and is referenced by the Performance Release Checklist).

For overall performance gates, see:

- [Performance Budget](../../documentation/performance-budget.md)
- [Performance Release Checklist](../../checklists/performance-release-checklist.md)

---

## 0. Preconditions

Before you rely on this checklist:

- [ ] The app can produce a **production build** (`next build` or equivalent).
- [ ] There is a way to inspect bundles:
  - [ ] Next.js build output (`.next` stats, terminal summary), or
  - [ ] Bundle analyzer (e.g. `@next/bundle-analyzer`).

<!-- SPECIAL NOTE: Once you configure an analyzer, document the script here, e.g.:
     - `npm run analyze` → opens a bundle report
     - or link to CI artifact with stats.json. -->

---

## 1. When You Add or Change a Dependency

Whenever you add a new library—or significantly change how an existing one is used:

- [ ] Ask “Do we really need this?”:
  - [ ] No native/standard alternative exists.
  - [ ] Library is actively maintained and not absurdly heavy for what it does.

- [ ] Check if the library supports:
  - [ ] **Tree-shaking** (ES modules).
  - [ ] Importing only what’s needed (e.g. `import { X } from "lib/x"` not `import * as lib from "lib"`).

- [ ] Avoid full-library imports when unnecessary:
  - [ ] ✅ `import { Line } from "react-chartjs-2";`
  - [ ] ❌ `import * as ChartJS from "react-chartjs-2";`

- [ ] For UI/icon libraries:
  - [ ] Import individual icons/components instead of the entire pack.

If a library is heavy but necessary:

- [ ] Plan to **lazy-load** the feature or page where it’s used (`next/dynamic` or route-level code splitting).

---

## 2. Build & Check Bundle Sizes (Local / Dev)

Before merging a PR that might impact size:

1. **Run a production build**:

   ```bash
   npm run build
   ```
