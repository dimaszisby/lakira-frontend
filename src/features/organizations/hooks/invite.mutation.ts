import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {InviteMemberInput} from "../api";
import { inviteMember } from "../api";
import { invalidateMembers } from "../cache";
import { useOrganizationId } from "../context";

export const useInviteMemberMutation = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  const organizationId = useOrganizationId();

  return useMutation<unknown, Error, InviteMemberInput>({
    mutationFn: (input) => inviteMember(organizationId, input),
    onSuccess: async () => {
      // An invite creates a membership in `invited` status, so the list changes.
      await invalidateMembers(qc, organizationId);
      onSuccess?.();
    },
    retry: false,
  });
};
