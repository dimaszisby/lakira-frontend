# Auth form fields do not declare their purpose

**Purpose:** add `autoComplete` tokens to the auth forms' email and password fields.
**Owner:** hardini
**Branch:** `fix/auth-fields-missing-autocomplete` off `dev`
**Priority:** low. WCAG 2.1 AA gap, small fix.
**Found:** 2026-09-29, writing the `/login` keyboard spec in kit
`docs/internal/initiatives/cypress-a11y-e2e/`.

## What is wrong

WCAG 1.3.5 Identify Input Purpose (AA) asks that fields collecting the user's own information say
what they are, which in HTML is the `autocomplete` attribute. axe cannot report its absence: its
`autocomplete-valid` rule only checks a value that is present, so every suite passes.

Measured in `src/features/auth/components/`:

| Form                     | Field                  | `autoComplete` today | Should be             |
| ------------------------ | ---------------------- | -------------------- | --------------------- |
| `LoginForm.tsx`          | email (`type="text"`)  | none                 | `email` or `username` |
| `LoginForm.tsx`          | password               | none                 | `current-password`    |
| `RegisterForm.tsx`       | email                  | none                 | `email`               |
| `RegisterForm.tsx`       | password, confirmation | `new-password`       | unchanged             |
| `ForgotPasswordForm.tsx` | email                  | none                 | `email`               |
| `ResetPasswordForm.tsx`  | password, confirmation | none                 | `new-password`        |

The login email field is also `type="text"`; `type="email"` would bring the mobile email keyboard.

The table missed one field: the registration **Username**, which had no token either.

## Decisions

**The registration username is `nickname`, not `username`.** The app signs in by email; the
username is a public handle nobody signs in with. A field marked `username` on a sign-up form is
what password managers store as the login, and they would later fill the handle into the login
form's email field. `nickname` is also on WCAG 1.3.5's list of input purposes, so the field still
declares one. The login and registration email fields are `email`. Decided 2026-09-29.

**`type="email"` on the login and forgot-password fields.** Registration already had it. All three
forms set `noValidate`, so the browser adds no validation of its own; Zod still validates. The
change brings the email keyboard on phones. `TextField` uses no selection API, which email inputs
do not support. Decided 2026-09-29.

## To do

- [x] Tokens added, through `TextField`'s passthrough: login `email` and `current-password`;
      registration `nickname` and `email` (passwords were already `new-password`); forgot-password
      `email`; reset-password `new-password` on both fields
- [x] `type="email"` on the login and forgot-password email fields
- [x] `src/features/auth/components/__tests__/auth-form-autocomplete.test.tsx`, one case per form,
      querying by label. All four failed before the tokens were added; after, the two `type`
      assertions failed until the type was added
- [x] Keyboard spec still passes (it identifies fields by `name`)

## Status

Done 2026-09-29 on `fix/auth-fields-missing-autocomplete`.
