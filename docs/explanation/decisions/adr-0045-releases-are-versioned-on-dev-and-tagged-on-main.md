# ADR-0045 — Releases are versioned on `dev` and tagged on `main`

- **Status:** Accepted
- **Date:** 2026-10-27
- **Related:** builds on ADR-0041 (`main` changes only by promotion); changes the stance of
  ADR-0042, option 3, that no workflow holds a write token
- **Origin:** issue #174 (register row F-75), under two days and so without a kit; the owner chose
  the shape on 2026-10-27

---

## Context

`main` is the release branch, and it changes only by a pull request from `dev` merged with a merge
commit (ADR-0041). A promotion carried no version: no tag, no changelog, no GitHub release, and
`package.json` stayed at `0.1.0` through the first promotion, #147. A reader could not say which
`main` commit was which release, or what one added over the last.

Two constraints rule out the usual tools. Every pull request into `dev` and `main` needs "CI
passed" (ADR-0039, ADR-0041), and a pull request opened with a workflow's `GITHUB_TOKEN` starts no
workflow, so CI never runs on it. And nothing may exist only on `main`: a commit made there, not
reached through `dev`, would conflict with the next promotion.

## Decision

1. **The version is bumped on `dev`, in an ordinary pull request.** `npm run release:prepare --
<bump>` (`scripts/github/release.ts`) sets the next version in `package.json` and
   `package-lock.json`. It also adds a `CHANGELOG.md` section listing the commit subjects `dev`
   holds and `main` does not, grouped by Conventional Commit type. It commits nothing. A person
   opens the pull request, so CI runs on it as on any other.
2. **The tag is made on `main`, by a workflow.** `release.yml` runs on every push to `main`, which
   is always a promotion. When `package.json`'s version has no tag, it tags the pushed merge commit
   `v<version>` and creates a GitHub release whose notes are that version's `CHANGELOG.md` section.
   When the tag exists, the promotion carried no new version and the job does nothing.
3. **That job is the only one with a write token.** It holds `contents: write`, while the workflow
   defaults to `contents: read`. It runs `gh`, which the runner ships, and `actions/*` pinned by
   SHA, so no third-party code runs with the token. It reads no secret.
4. **Versions follow SemVer below 1.0.** The first tagged release is `v0.2.0`; `0.1.0` stands for
   the untagged state #147 promoted. Staying below 1.0 says a fork's interfaces may still change.

## Options considered

- **release-please:** rejected. Its release pull request is opened with `GITHUB_TOKEN`, so "CI
  passed" never runs and the rulesets block the merge unless a personal access token or a GitHub
  App is added as a secret, where no job reads one today. It also expects the release pull request
  to target the branch it tags, `main`, which only promotions may change.
- **semantic-release on `main`:** rejected. It computes the version on the push to `main`, then
  pushes the bumped `package.json` and changelog back as a commit. That push is refused by the
  ruleset, and if it were allowed the commit would exist only on `main`.
- **Tags and releases only, from GitHub's generated notes:** rejected. `package.json`'s version
  would never move, and a fork would get no changelog: forks copy tags, not releases.
- **Tagging by hand after each promotion:** rejected. The step is easy to forget, and a person's
  token is broader than one job's `contents: write`.

## Consequences

- A release is two pull requests: `chore(release): <version>` into `dev`, then the promotion.
  Promoting without a bump is still allowed, and tags nothing.
- The changelog is only as good as the commit subjects. The history since #147 is all Conventional
  Commits; a subject that is not one is listed under "Other".
- The workflow first runs on the promotion after this merges; its run and `gh release view v0.2.0`
  are the evidence, recorded on that promotion.
- `src/__tests__/release-versioning.test.ts` checks the script's functions, that `CHANGELOG.md`
  and the lockfile match `package.json`, and the workflow's triggers, permissions and actions.
- The backend tags nothing either; it may adopt this setup with the rest of the tracker (step 6 of
  ADR-0042's path).
