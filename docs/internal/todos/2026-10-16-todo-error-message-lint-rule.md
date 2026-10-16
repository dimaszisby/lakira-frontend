# 2026-10-16 - Todo: a lint rule against rendering `error.message`

**Context:** debt register row F-28, left out of scope by N12
(`2026-10-10-todo-reaudit-findings.md` § Status). N12 fixed eight components that printed the
Axios message ("Request failed with status code 409") instead of the server's sentence, and F-08
fixed two route boundaries that printed `error.message`. The rule was written down in
`.claude/rules/data-access.md` and `.claude/rules/architecture.md`; nothing enforced it.

## Checklist

- [x] `eslint.config.mjs`: `errorMessageSelectors`, two `no-restricted-syntax` selectors, spread
      into the block that already sets the rule for component files
- [x] `src/__tests__/eslint-error-message.test.ts`: resolves the real config for one path in each
      covered directory, then lints snippets with those options
- [x] The test seen to fail (12 of 16) with the selectors removed from the block, then restored
- [x] A probe in `LoginForm.tsx` (`error ? error.message : ""`) seen to fail `eslint` with the
      rule's message, then reverted
- [x] `npm run lint` clean on the unchanged code: every `.message` in a component file was
      React Hook Form's `errors.<field>?.message`
- [x] `.claude/rules/code-style.md`, `data-access.md`, `architecture.md` name the rule
- [x] Register: F-28 closed

## What the rule matches

Reading `.message` off a name that looks like an error, in a `.tsx` file under
`src/components/ui`, `src/components/layout`, `src/features` or `src/app`, tests excluded:

- directly: `error`, `err`, `e` or `<anything>Error` (`error.message`, `deleteError?.message`);
- as a property: `mutation.error.message`, `query.error?.message`, `m.createError.message`.

`errors.email?.message` ends in a field name and is not matched.

## Known limits

Matched by name, so the rule cannot see:

- a destructure, `const { message } = error`;
- `String(error)` or a template literal around the error itself;
- an error held under another name (`failure.message`);
- `.ts` files. `src/lib` and `src/services` read `.message` for logging and normalizing, which is
  correct there, and no hook builds UI text from an error today.

A rule that follows types (is this an `AxiosError`?) would need a custom plugin. Not worth it
while the name-based rule finds nothing to fix.

## Status

Done 2026-10-16 on `chore/error-message-lint-rule`. Gates and evidence in the PR.

- [x] Found: the F-29 row's Source read "same", pointing at a row that #100 had moved to Closed
      → in scope, the register row now names its source.
