import { useMutation } from "@tanstack/react-query";

import { persistSessionToken } from "@/features/shared/session.client";
import { hardNavigate } from "@/lib/hard-navigate";
import { authRoutes } from "@/lib/routes";

import { switchOrganization } from "../api";

const AFTER_SWITCH = authRoutes.afterAuth();

/**
 * Switch the session to another organization, then reload into it.
 *
 * Every exit from a successful backend switch leaves the browser wholly in the
 * new organization or signed out, never split between two. See D-02 and D-03 in
 * `docs/internal/initiatives/org-switcher/decisions.md`.
 *
 * - The new token is stored as the session, then `/dashboard` is loaded as a
 *   full document. That empties every client cache, and the server layout
 *   re-reads the organization claim from the new cookie.
 * - If storing the token fails, the refresh cookie already belongs to the new
 *   organization while the session still holds the old one. Revive redeems the
 *   refresh cookie into a matching session, or signs the user out.
 *
 * On a failed switch (403, 401, network) nothing navigates and the session is
 * untouched; the error is the caller's to show.
 */
export const useSwitchOrganizationMutation = () =>
  useMutation<void, Error, string>({
    mutationFn: async (organizationId) => {
      const { token } = await switchOrganization(organizationId);
      const isStored = await persistSessionToken(token);

      hardNavigate(isStored ? AFTER_SWITCH : authRoutes.revive(AFTER_SWITCH));
    },
    retry: false,
  });
