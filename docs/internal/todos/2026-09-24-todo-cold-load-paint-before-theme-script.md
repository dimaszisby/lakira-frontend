# A cold load can paint before the theme script runs

**Purpose:** decide whether the rare first paint without `data-theme` is worth closing.
**Owner:** hardini
**Branch:** unassigned
**Priority:** low
**Found:** while measuring `2026-09-20-todo-two-pre-paint-theme-scripts.md`.

## What was measured

On a cold browser cache, with the CPU throttled 6x, about **1 load in 30** paints once before any
theme script has run. A user whose stored theme is `dark` while their OS is light sees one
non-contentful frame on the light defaults, then dark. Examples: first paint at 228 ms, first
`data-theme` write at 231 ms; first paint at 300 ms, write at 304 ms. Every such paint was the
first or second load in a fresh browser; none occurred later in a session. Removing
`theme-init.js` made no difference to the rate.
Method and numbers: the two-pre-paint-theme-scripts todo.

## Why it happens

next-themes injects its script as the **first node in `<body>`**. Chrome can paint the `<html>`
background once `<head>` is done, before the parser reaches `<body>` — rarely when warm, sometimes
when the cache is cold.

## Options

- Leave it. One frame, cold cache only, only when stored theme and OS disagree.
- A small blocking inline script in `<head>` that reads `lakira.theme` — which reintroduces the
  second script and the mirrored literal the parent todo just removed, and needs care with CSP.
- A CSS default that avoids the light background before `data-theme` is set. Not obviously
  possible, since the right value depends on storage that CSS cannot read.

## Checklist

- [ ] Decide whether one cold-load frame is worth a second script.
