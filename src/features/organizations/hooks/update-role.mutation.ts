import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateMemberRole } from "../api";
import { invalidateMembers } from "../cache";
import { useOrganizationId } from "../context";
import type { MemberRole } from "../types";

export const useUpdateMemberRoleMutation = () => {
  const qc = useQueryClient();
  const organizationId = useOrganizationId();

  return useMutation<unknown, Error, { membershipId: string; role: MemberRole }>({
    mutationFn: ({ membershipId, role }) => updateMemberRole(membershipId, role),
    onSuccess: async () => {
      await invalidateMembers(qc, organizationId);
    },
    retry: false,
  });
};
