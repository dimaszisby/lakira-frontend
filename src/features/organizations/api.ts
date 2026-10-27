import { buildQueryString } from "@/features/shared/api";
import api from "@/services/api/api";
import { withApiErrorHandling } from "@/services/api/withApiErrorHandling";
import type ApiResponse from "@/types/generics/ApiResponse";
import { unwrap } from "@/types/generics/ApiResponse";
import type { RequestOpts } from "@/types/generics/RequestOpts";

import type {
  InvitableRole,
  Member,
  MemberRole,
  MembersPage,
  MembersResponse,
  UserOrganizationsPage,
  UserOrganizationsResponse,
} from "./types";

/**
 * Organization membership calls.
 *
 * Follows the feature-module convention — `withApiErrorHandling` + `unwrap` —
 * rather than the legacy `src/services/api/auth.api.ts` shape.
 */

type Page<T> = { rows: T[]; nextCursor?: string | null };

/**
 * Every page of a list the backend pages by cursor, 100 rows at most since
 * lakira-backend #218, fetched in turn and merged. The list ends when
 * `nextCursor` is null or absent. A cursor already followed also ends it, with
 * the rows collected so far, so a backend that repeats one cannot loop the
 * browser. Kit `org-lists-follow-cursor`, D-01.
 */
const collectPages = async <T>(
  fetchPage: (after: string | undefined) => Promise<Page<T>>,
  functionName: string,
): Promise<T[]> => {
  const rows: T[] = [];
  const followed = new Set<string>();
  let after: string | undefined;

  for (;;) {
    // Each page needs the previous page's cursor, so the requests are serial.
    const page = await fetchPage(after);
    rows.push(...page.rows);

    const next = page.nextCursor ?? undefined;
    if (next === undefined) return rows;
    if (followed.has(next)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[API] ${functionName}: the backend repeated a cursor; stopped paging`);
      }
      return rows;
    }
    followed.add(next);
    after = next;
  }
};

export const listMembers = (organizationId: string, opts?: RequestOpts) =>
  withApiErrorHandling(async (): Promise<MembersResponse> => {
    const members = await collectPages(
      (after) =>
        api
          .get<ApiResponse<MembersPage>>(
            `/organizations/${organizationId}/members${buildQueryString({ after })}`,
            opts,
          )
          .then(unwrap)
          .then((page) => ({ rows: page.members, nextCursor: page.nextCursor })),
      "listMembers",
    );
    return { members };
  }, "listMembers");

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
        .post<
          ApiResponse<{ message?: string }>
        >(`/organizations/${organizationId}/invites`, input, opts)
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
    () =>
      api.patch<ApiResponse<Member>>(`/memberships/${membershipId}`, { role }, opts).then(unwrap),
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
    () =>
      api.post<ApiResponse<{ message?: string }>>("/invites/accept", { token }, opts).then(unwrap),
    "acceptInvite",
  );

/** The organizations the signed-in user belongs to, oldest membership first. */
export const listMyOrganizations = (opts?: RequestOpts) =>
  withApiErrorHandling(async (): Promise<UserOrganizationsResponse> => {
    const organizations = await collectPages(
      (after) =>
        api
          .get<ApiResponse<UserOrganizationsPage>>(
            `/organizations${buildQueryString({ after })}`,
            opts,
          )
          .then(unwrap)
          .then((page) => ({ rows: page.organizations, nextCursor: page.nextCursor })),
      "listMyOrganizations",
    );
    return { organizations };
  }, "listMyOrganizations");

/**
 * Move the session to another organization.
 *
 * The backend checks the membership (403 otherwise) and issues a new access
 * token carrying the new `organizationId` claim, with a fresh refresh cookie.
 * The proxy stores both and strips the token from the body (ADR-0025), so this
 * resolves with nothing to act on.
 */
export const switchOrganization = (organizationId: string, opts?: RequestOpts) =>
  withApiErrorHandling(
    () =>
      api
        .post<ApiResponse<Record<string, never>>>("/auth/switch-org", { organizationId }, opts)
        .then(() => undefined),
    "switchOrganization",
  );
