import { useMutation, useQueryClient } from "@tanstack/react-query";

import { removeMember } from "../api";
import { invalidateMembers } from "../cache";
import { useOrganizationId } from "../context";

export const useRemoveMemberMutation = () => {
  const qc = useQueryClient();
  const organizationId = useOrganizationId();

  return useMutation<unknown, Error, string>({
    mutationFn: (membershipId) => removeMember(membershipId),
    onSuccess: async () => {
      await invalidateMembers(qc, organizationId);
    },
    retry: false,
  });
};
