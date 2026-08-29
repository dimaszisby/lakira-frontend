"use client";

import { useMemo } from "react";

import { useOrganizationMembers } from "@/features/organizations/hooks/members.query";
import { handleApiError } from "@/services/api/handleApiError";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import ErrorMessage from "@/ui/ErrorMessage";
import SkeletonLoader from "@/ui/SkeletonLoader";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  invited: "Invited",
  removed: "Removed",
};

const MemberList = () => {
  const { data, isPending, error } = useOrganizationMembers();
  const serverErrorMsg = useMemo(() => (error ? handleApiError(error).join(", ") : ""), [error]);
  const members = data?.members ?? [];

  return (
    <Card variant="primary" size="md">
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>Everyone with access to this organization.</CardDescription>
      </CardHeader>

      <CardContent>
        {serverErrorMsg ? <ErrorMessage message={serverErrorMsg} className="mb-2" /> : null}

        {isPending ? <SkeletonLoader /> : null}

        {!isPending && members.length === 0 && !serverErrorMsg ? (
          <p className="text-body2">No members yet.</p>
        ) : null}

        {members.length > 0 ? (
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Organization members</caption>
            <thead>
              <tr className="text-ink-muted">
                <th scope="col" className="py-2">
                  Member
                </th>
                <th scope="col" className="py-2">
                  Role
                </th>
                <th scope="col" className="py-2">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.membershipId} className="border-t border-surface2">
                  <td className="py-3">
                    <span className="block font-medium text-ink">{member.username}</span>
                    <span className="text-ink-muted block">{member.email}</span>
                  </td>
                  <td className="py-3">{ROLE_LABEL[member.role] ?? member.role}</td>
                  <td className="py-3">{STATUS_LABEL[member.status] ?? member.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default MemberList;
