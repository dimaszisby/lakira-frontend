import { useMutation } from "@tanstack/react-query";

import { hardNavigate } from "@/lib/hard-navigate";
import { authRoutes } from "@/lib/routes";

import { switchOrganization } from "../api";

const AFTER_SWITCH = authRoutes.afterAuth();

/**
 * Switch the session to another organization, then reload into it.
 *
 * The proxy stores the new session on the switch response itself: the access
 * token and the refresh cookie arrive together, so the browser is wholly in the
 * new organization or, if the backend's answer was unusable, signed out. It is
 * never split between two (ADR-0025). The token does not pass through here.
 *
 * `/dashboard` is then loaded as a full document. That empties every client
 * cache, and the server layout re-reads the organization claim from the new
 * cookie (ADR-0020).
 *
 * On a failed switch (403, 401, 502, network) nothing navigates; the error is
 * the caller's to show.
 */
export const useSwitchOrganizationMutation = () =>
  useMutation<void, Error, string>({
    mutationFn: async (organizationId) => {
      await switchOrganization(organizationId);
      hardNavigate(AFTER_SWITCH);
    },
    retry: false,
  });
