import type { QueryClient } from "@tanstack/react-query";

import type { UserAtom } from "@/src/services/state/atoms";

import { authKeys } from "./keys";

export const getCachedUserProfile = (qc: QueryClient) =>
  qc.getQueryData<UserAtom | null>(authKeys.profile());

export const setCachedUserProfile = (qc: QueryClient, user: UserAtom | null) =>
  qc.setQueryData<UserAtom | null>(authKeys.profile(), user);

export const invalidateUserProfile = async (qc: QueryClient) =>
  await qc.invalidateQueries({ queryKey: authKeys.profile() });

export const removeUserProfile = (qc: QueryClient) =>
  qc.removeQueries({ queryKey: authKeys.profile() });
