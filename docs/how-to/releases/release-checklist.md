# Release Checklist – Lakira Frontend

## Before promoting

Run the backend's
[pre-production smoke sequence](https://github.com/dimaszisby/lakira-backend/blob/dev/docs/how-to/ci-cd/run-the-pre-production-smoke-sequence.md)
against the environment first. It checks the deployed backend directly: health, then one smoke
account logging in, refreshing, reading, writing, cleaning up and logging out.

The frontend's own half, the same round trip through `/api/proxy`, is not written yet. It waits on a
production environment to promote to (issue #171).

## Promoting

[Promote `dev` to `main`](promote-dev-to-main.md): first bump the version on `dev` with
`npm run release:prepare` (ADR-0045), then a pull request from `dev`, merged with a merge commit
once "CI passed" is green (ADR-0041). The `release` workflow tags the promotion `v<version>`.

## Links:

- See a11y-release-checklist.md
- See performance-release-checklist.md
