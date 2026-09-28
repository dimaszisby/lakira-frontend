import { useQuery } from "@tanstack/react-query";

import { listMyOrganizations } from "../api";
import { useOrganizationId } from "../context";
import { organizationKeys } from "../keys";
import type { UserOrganizationsResponse } from "../types";

export const useMyOrganizations = (opts?: { enabled?: boolean }) => {
  const organizationId = useOrganizationId();

  return useQuery<UserOrganizationsResponse, Error>({
    queryKey: organizationKeys.mine(organizationId),
    queryFn: ({ signal }) => listMyOrganizations({ signal }),
    enabled: opts?.enabled ?? true,
  });
};
