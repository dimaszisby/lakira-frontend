import api from "@/services/api/api";
import { withApiErrorHandling } from "@/services/api/withApiErrorHandling";
import type ApiResponse from "@/types/generics/ApiResponse";
import { unwrap } from "@/types/generics/ApiResponse";
import type { RequestOpts } from "@/types/generics/RequestOpts";

import type { InvitableRole, Member, MemberRole, MembersResponse } from "./types";

/**
 * Organization membership calls.
 *
 * Follows the feature-module convention — `withApiErrorHandling` + `unwrap` —
 * rather than the legacy `src/services/api/auth.api.ts` shape.
 */

export const listMembers = (organizationId: string, opts?: RequestOpts) =>
  withApiErrorHandling(
    () =>
      api
        .get<ApiResponse<MembersResponse>>(`/organizations/${organizationId}/members`, opts)
        .then(unwrap),
    "listMembers",
  );

export type InviteMemberInput = {
  email: string;
  /** `owner` is assigned by the backend on creation and cannot be invited. */
  role: InvitableRole;
};

export const inviteMember = (
  organizationId: string,
  input: InviteMemberInput,
  opts?: RequestOpts,
) =>
  withApiErrorHandling(
    () =>
      api
        .post<ApiResponse<{ message?: string }>>(
          `/organizations/${organizationId}/invites`,
          input,
          opts,
        )
        .then(unwrap),
    "inviteMember",
  );

/**
 * Change a member's role.
 *
 * Addressed by membership id, not organization id — the backend resolves the
 * organization from the membership itself.
 */
export const updateMemberRole = (membershipId: string, role: MemberRole, opts?: RequestOpts) =>
  withApiErrorHandling(
    () => api.patch<ApiResponse<Member>>(`/memberships/${membershipId}`, { role }, opts).then(unwrap),
    "updateMemberRole",
  );

export const removeMember = (membershipId: string, opts?: RequestOpts) =>
  withApiErrorHandling(
    () => api.delete<ApiResponse<null>>(`/memberships/${membershipId}`, opts).then(unwrap),
    "removeMember",
  );

/** Accept an invitation. The token arrives in an emailed link. */
export const acceptInvite = (token: string, opts?: RequestOpts) =>
  withApiErrorHandling(
    () => api.post<ApiResponse<{ message?: string }>>("/invites/accept", { token }, opts).then(unwrap),
    "acceptInvite",
  );
