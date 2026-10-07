---
name: reaudit-p2-sweep-review
description: Review of chore/reaudit-p2-sweep (dashboard invalidator, contract tests, dompurify removal); what to check when a sweep adds an invalidator or claims docs were updated
metadata:
  type: project
---

Verdict: request changes, branch chore/reaudit-p2-sweep (uncommitted working tree).

**How to apply:** When a change adds an invalidator and lists the mutations that call it, derive the list independently from what the cached payload contains (every field of the DTO and what writes each one), not from the mutations the author named; a payload field gated by a setting (here a show-on-dashboard flag) makes the settings mutations part of the set. When a decisions entry says a rule or doc "now says" something, grep the named files in the diff: an entry written ahead of the edit reads as done. Check every cited ADR number exists in the registry and every README link resolves. For tests that compare code against a contract file, check the equality is two-sided and non-vacuous, then look for lookup granularity the code has but the test lacks (path-only versus method). On hydration: the dehydrated state replaces the client query only when newer, so an invalidation matters mainly for back/forward and for a mounted observer.
