"use client";

import type {ReactNode} from "react";
import { createContext,  useContext } from "react";

/**
 * The organization the current session is acting for.
 *
 * Sourced server-side from the `organizationId` claim on the session JWT, in
 * `src/app/(app)/layout.tsx`, which already reads the session cookie to gate
 * the route.
 *
 * ## Why not `userAtom`
 *
 * `userAtom` is populated client-side by `profile.query.ts` after a fetch, so
 * it is `null` on every hard load until that query resolves. An org id read
 * from it would produce `undefined`-scoped cache keys on first paint and then
 * re-key once the profile landed — briefly caching data under a key that does
 * not identify its tenant. Reading the claim on the server makes the value
 * present on first render instead, and it is the same claim the backend
 * authorizes against.
 */
const OrganizationContext = createContext<string | null>(null);

type Props = {
  /** `organizationId` claim from the session token. */
  organizationId: string;
  children: ReactNode;
};

export const OrganizationProvider = ({ organizationId, children }: Props) => (
  <OrganizationContext.Provider value={organizationId}>{children}</OrganizationContext.Provider>
);

/**
 * The active organization id, for scoping cache keys and org-addressed calls.
 *
 * Throws when read outside the provider. That is deliberate: a missing org id
 * must fail loudly rather than fall back to `undefined` and silently produce a
 * cache key that does not identify its tenant. A user in two organizations
 * would then be served one org's cached payload while acting as the other —
 * the defect `lakira-backend` shipped and patched as findings N1/N2.
 */
export const useOrganizationId = (): string => {
  const organizationId = useContext(OrganizationContext);

  if (!organizationId) {
    throw new Error(
      "useOrganizationId must be used inside an OrganizationProvider. " +
        "Cache keys cannot be tenant-scoped without it.",
    );
  }

  return organizationId;
};
