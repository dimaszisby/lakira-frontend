# Auth form fields do not declare their purpose

**Purpose:** add `autoComplete` tokens to the auth forms' email and password fields.
**Owner:** hardini
**Branch:** none yet; branch off `dev` when picked up
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

## To do

- [ ] Add the tokens above through `TextField`'s passthrough
- [ ] Consider `type="email"` on the login and forgot-password email fields
- [ ] A unit test per form asserting the attributes, watched failing first
- [ ] Keyboard spec in `cypress/e2e/public/login-keyboard.cy.ts` still passes (it identifies fields
      by `name`, so a type change does not affect it)

## Status

Open.
