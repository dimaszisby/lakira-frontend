# 2026-10-23 - Todo: re-inviting replaces a pending invite (B-71), then the invite form's copy

**Context:** register row F-65, owner question O-14. Since the backend queued the invite email
(lakira-backend ADR-0070, register row B-70), `POST /organizations/{id}/invites` with
`RABBITMQ_ENABLED=true` answers 201 once the invite is saved and its email queued. An email that
parks after its last retry, or a job never published because the server stopped, leaves a pending
invite nobody received. Re-inviting that address answers 409 until the invite expires,
`INVITE_TOKEN_TTL_DAYS` later (7 by default). The backend accepted the gap for now
(`durable-invite-email` D-04) and asked the frontend to choose the remedy: backend register row
B-71, backend todo `2026-10-19-todo-parked-invite-email-blocks-reinvite.md`, and the Part 2 record
"The invite email is queued; an undelivered invite blocks re-inviting" on the Notion page "FE and
BE messages".

## Decided

The owner answered O-14 on 2026-10-23:

1. **Re-inviting replaces a pending invite.** The backend mints a new token, extends the expiry,
   sends the email again, and answers 201 instead of 409. The earlier link stops working and the
   newer role wins.
   - Chosen over a resend endpoint, which would keep the 409 and need a new list of pending
     invites and a screen for it: about a day on each side for a P3 row.
   - It also covers an email that was sent but lost, for example to spam, which answers 409 today
     in both queue modes.
2. **The form's copy changes once B-71 ships.** "Invitation sent."
   (`src/features/organizations/components/InviteMemberForm.tsx`) becomes "Invitation sent. If it
   doesn't arrive, send it again."
   - Not before: until the backend replaces a pending invite, sending again can still answer 409,
     and the copy would promise something the API does not do.

The decision changes the backend's API behaviour, so the ADR is the backend's to write when it
builds B-71. The copy change is not an interface change. No frontend ADR.

## Checklist

- [ ] The backend ships option 1 (B-71) on `dev`, and its Part 2 record moves to Action needed
- [ ] `npm run api:spec:check`; sync the snapshot if the 409's description for
      `POST /organizations/{id}/invites` changed
- [ ] `InviteMemberForm.tsx` shows "Invitation sent. If it doesn't arrive, send it again." on a
      success; `SENT_NOTE` in `InviteMemberForm.int.test.tsx` follows
- [ ] An integration case: inviting an address twice shows the success note both times, with MSW
      answering 201 to each
- [ ] Register: F-65 to Closed; the Part 2 record acknowledged with the frontend PR
