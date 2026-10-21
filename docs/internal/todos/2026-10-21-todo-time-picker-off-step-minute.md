# 2026-10-21 - Todo: the time picker shows the real minute between steps

**Context:** register row F-31. In the log form's time picker, choosing minute 0 changed nothing when
the current minute was 02, and the field stayed at 9:02 PM. It was seen once, in Cypress, and
recorded as unexplained in `2026-10-08-todo-dashboard-count-assertions.md`, with an inference that
was not checked: the minute list steps by five.

## Cause

`src/components/ui/DateTimePicker.tsx` listed only the minute steps (`minuteStep={5}` in
`LogForm.tsx`) and set the minute `<select>`'s value to the nearest step (`closestStep`). The log
form starts at the current time, which is usually between steps, so at 9:02 the list showed "00"
while the value was 02:

- **The list disagreed with the trigger,** which read "9:02 PM".
- **Choosing "00" did nothing.** It picked the option already selected, and a browser fires no
  `change` event for that, so the time was never set.

It was not only minute 0. Every off-step minute did the same for its nearest step: 01 and 02
against 00, 03 and 04 against 05, and so on.

## Fix

The minute list offers every step, plus the value's own minute when it falls between them, in
order, and the select's value is the real minute: at 9:02 it reads `00, 02, 05, …` with "02"
selected. Choosing "00" is then a change. The extra option goes once a step is picked.
`closestStep` is removed.

The value is not snapped to a step, which would silently change the logged time; the form has
sent the exact time since N15. No props changed.

- [x] `src/components/ui/DateTimePicker.tsx`: `minuteOptionsFor`, the select's value is the real
      minute, `closestStep` removed
- [x] `src/components/ui/__tests__/DateTimePicker.test.tsx`:
  - at 9:02 with step 5 the select reads "02" and choosing "0" gives 9:00;
  - an on-step value adds no option;
  - the step case at 9:12 now lists `0, 12, 15, 30, 45`.
- [x] `cypress/e2e/stack/log-time-picker.cy.ts`, in a real browser, with only `Date` frozen at
      minute 02: the list reads "02", and choosing "00" moves the trigger to `:00`
- [x] Seen to fail, Jest: with the old file restored, the two value cases fail
- [x] Seen to fail, Cypress: against a production build of the old file, both cases fail. The
      list read "00" where 02 was expected, and after choosing "00" the trigger still read
      "8:02 PM", which is F-31 as recorded
- [x] Register: F-31 closed; the source todo's Found box ticked with a pointer here

## Status

Done 2026-10-21 on `fix/time-picker-off-step-minute` (#132). Node 24.21.0, production build with
CI's environment, local backend at `5a3addb` (backend `dev`). The gate results are in the PR.

jsdom cannot show the no-event half: `user.selectOptions` fires `change` even for the option
already selected, so the Jest case shows only that the list tells the truth. The Cypress case
shows the rest.
