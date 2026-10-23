# Org lists follow the cursor — Checklist

Register row F-76. The two organization lists read only their first page of 100 rows; the owner
chose to fetch every page with no interface change ([D-01](decisions.md)).

## Change

- [x] `src/features/organizations/api.ts`: `collectPages` follows `nextCursor`, stops on a
      repeated cursor; `listMembers` and `listMyOrganizations` use it and keep their return shape
- [x] `src/features/organizations/types.ts`: `MembersPage` and `UserOrganizationsPage`, one page
      with its `nextCursor`
- [x] `MemberList.int.test.tsx`: two pages render both members, the second request carries
      `after=page-2`; a repeated cursor stops after two requests with one warning. Both failed
      before the change
- [x] `OrganizationSwitcher.int.test.tsx`: two pages render both organizations. Failed before
      the change

## Docs

- [x] Register: F-76 moved to `register-closed.md` with #151, "As of" moved to `04c2f5a`; the
      register README's status line
- [x] `docs/internal/initiatives/README.md`: this kit under Done

## Discovered

- [x] Found: the existing fixtures send no `nextCursor` → in scope, an absent cursor ends the
      list like a null one, and every earlier case passes unchanged

## Acceptance

- [x] A members list over two pages shows every member, and the second request asks for
      `after` the first page's cursor. _Why:_ F-76. · **a machine checked it**: the new case in
      `MemberList.int.test.tsx`
- [x] An organization list over two pages shows every organization. _Why:_ F-76. · **a machine
      checked it**: the new case in `OrganizationSwitcher.int.test.tsx`
- [x] A repeated cursor ends the loop after the page that repeated it. _Why:_ the cursor loop the
      backend found in review of #218. · **a machine checked it**: `MemberList.int.test.tsx`
- [x] A cancelled request during a later page is still a cancellation, not an error. _Why:_ React
      Query cancels on unmount. · **I checked it**: the loop runs inside `withApiErrorHandling`,
      whose `isAbortError` branch sees an abort from any page
- [x] F-76 is closed in the register. _Why:_ the register is what "what's next" reads. ·
      `register-todos` passes in the unit gate

## Gates

- [x] lint
- [x] typecheck
- [x] format
- [x] unit tests
- [x] integration
- [x] spec drift and `security:audit`
- [x] build
- [ ] css lint, e2e, e2e (csp), e2e (stack) and e2e (csp, stack): skipped, no style or end-to-end
      flow changed, and the stack cannot make a list of more than 100 rows
