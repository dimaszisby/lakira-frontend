import { useMutation } from "@tanstack/react-query";

import { acceptInvite } from "../api";

/**
 * Accepts an invitation.
 *
 * Not org-scoped: the caller is joining an organization it is not yet a member
 * of, so there is no active tenant cache to invalidate. The new membership
 * takes effect on the next token issued.
 */
export const useAcceptInviteMutation = () =>
  useMutation<unknown, Error, string>({
    mutationFn: (token) => acceptInvite(token),
    retry: false,
  });
