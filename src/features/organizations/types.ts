import type { components } from "@/types/api/generated/lakira-backend";

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

/**
 * One of the organizations the signed-in user belongs to, from
 * `GET /organizations`.
 *
 * Aliased from the generated schema rather than written by hand, so a backend
 * change to the shape surfaces as a type error at the next sync. See D-05 in
 * `docs/internal/initiatives/org-switcher/decisions.md`.
 */
export type UserOrganization = components["schemas"]["UserOrganization"];

export type UserOrganizationsResponse = {
  organizations: UserOrganization[];
};
