import { useQuery } from "@tanstack/react-query";

import { listMembers } from "../api";
import { useOrganizationId } from "../context";
import { organizationKeys } from "../keys";
import type { MembersResponse } from "../types";

export const useOrganizationMembers = (opts?: { enabled?: boolean }) => {
  const organizationId = useOrganizationId();

  return useQuery<MembersResponse, Error>({
    queryKey: organizationKeys.members(organizationId),
    queryFn: ({ signal }) => listMembers(organizationId, { signal }),
    enabled: opts?.enabled ?? true,
  });
};
