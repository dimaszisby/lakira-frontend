# Release Checklist – Lakira Frontend

## Before promoting

Run the backend's
[pre-production smoke sequence](https://github.com/dimaszisby/lakira-backend/blob/dev/docs/how-to/ci-cd/run-the-pre-production-smoke-sequence.md)
against the environment first. It checks the deployed backend directly: health, then one smoke
account logging in, refreshing, reading, writing, cleaning up and logging out.

The frontend's own half, the same round trip through `/api/proxy`, is not written yet. It waits on a
production environment to promote to (register row F-59).

## Links:

- See a11y-release-checklist.md
- See performance-release-checklist.md
