/**
 * Membership shapes, mirroring the `Member` schema in
 * `docs/reference/api/lakira-backend-openapi.json`. Verified against a live
 * response on 2026-08-29.
 */

/** Roles a membership can hold. `owner` is assigned by the backend, never invited. */
export type MemberRole = "owner" | "admin" | "member";

/** Invitations can only be sent for these; `owner` is not invitable. */
export type InvitableRole = Extract<MemberRole, "admin" | "member">;

export type MemberStatus = "active" | "invited" | "removed";

export type Member = {
  membershipId: string;
  userId: string;
  username: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
};

export type MembersResponse = {
  members: Member[];
};
