# Two pre-paint theme scripts are shipped, not one

**Purpose:** establish whether `public/scripts/theme-init.js` is still needed now that
`next-themes` injects its own pre-paint script.
**Owner:** hardini
**Branch:** unassigned
**Found:** while verifying no-flash behaviour under `feat/theme-switching`.

## What was observed

`curl http://localhost:3000/login` returns **both** of these in one document:

1. In `<head>`, the repo's own script, queued through `<Script strategy="beforeInteractive">` in
   `src/app/ThemeScript.tsx`:

   ```html
   <link rel="preload" href="/scripts/theme-init.js" as="script" />
   <script>
     (self.__next_s = self.__next_s || []).push(["/scripts/theme-init.js", { id: "theme-script" }]);
   </script>
   ```

2. As the **first node inside `<body>`**, an inline script `next-themes` injects itself:

   ```js
   ((e, i, s, u, m, a, l, h) => { … })("data-theme", "lakira.theme", "system", null, ["light", "dark"], null, true, true)
   ```

Both read `lakira.theme`, both fall back to `prefers-color-scheme`, and both set `data-theme` on
`<html>`. The work is being done twice.

## Why it is worth a look

- The `next-themes` script is inline and first in `<body>`, so it genuinely runs before paint. The
  repo's own goes through `__next_s`, which is Next's script queue — whether that still beats first
  paint in Next 16 App Router is the actual question, and it is not obvious from the markup.
- If `next-themes` is doing the job, `ThemeScript.tsx`, `public/scripts/theme-init.js`, the
  duplicated `THEME_STORAGE_KEY` literal, and the `scripts/bootstrap-fork.sh` sync burden that
  `src/constants/app.ts` documents at length could all go.
- If it is **not** doing the job, then the comment in `src/constants/app.ts` is right and the
  `next-themes` copy is the redundant one — but nothing currently says which.

Do not delete either on reasoning alone. The failure mode is a flash of the wrong theme on first
paint, which is exactly the bug the `storageKey` comment in `src/app/providers.tsx` records, and it
is invisible in tests.

## The check

- [ ] Throttle CPU in DevTools, hard-reload with a stored theme that differs from the OS setting,
      and record whether removing each script individually produces a visible flash.
- [ ] Decide which one stays; delete the other and its supporting machinery.
- [ ] If `theme-init.js` goes, update `src/constants/app.ts`'s module comment and
      `scripts/bootstrap-fork.sh`.
