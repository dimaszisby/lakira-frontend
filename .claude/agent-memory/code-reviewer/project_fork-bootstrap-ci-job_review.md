---
name: fork-bootstrap-ci-job-review
description: Review of fix/219-fork-passes-unit-gate (CI job replaying bootstrap-fork.sh, test skip keyed on docs/internal) - approve, no findings
metadata:
  type: project
---

Approve, no blocking findings, on branch `fix/219-fork-passes-unit-gate` (#219, ADR-0052).

**How to apply:** When a change adds a CI job that replays a documented procedure (a bootstrap script, a release recipe), do not rely on the author's local run: replay it on the CI's own OS flavour (a Linux container; the script's `sed -i` has BSD and GNU branches) and compare the job's steps line by line with the printed steps. When a test is made to skip on a missing folder, check the skip keys on the folder and not the file, so a moved file still fails upstream, and that the reads sit inside `beforeAll` (a skipped describe never runs it). When copying a tree into a container from macOS, use `COPYFILE_DISABLE=1 tar --exclude='._*'`; AppleDouble files otherwise produce hundreds of fake Prettier/ESLint failures that are not the change's. Grep docs for job-count prose ("all eight"), but leave accepted ADRs alone as they are immutable.
