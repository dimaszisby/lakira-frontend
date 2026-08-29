import type { QueryClient } from "@tanstack/react-query";

import { organizationKeys } from "./keys";

/** Refetch the member list after a membership changes. */
export const invalidateMembers = async (qc: QueryClient, organizationId: string) => {
  await qc.invalidateQueries({
    queryKey: organizationKeys.members(organizationId),
    exact: false,
  });
};
