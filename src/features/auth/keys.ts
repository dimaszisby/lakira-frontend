/**
 * Cache keys for the authenticated user's own profile.
 *
 * **Deliberately not organization-scoped.** Every other key factory carries an
 * organization id so a user in two organizations cannot be served the wrong
 * tenant's cache. The profile is a property of the *user*, not the tenant: it
 * is the same record whichever organization the session is acting for, and the
 * backend resolves it from the token's subject rather than its
 * `organizationId` claim.
 *
 * Scoping it would fragment one record across orgs and force a refetch on every
 * switch for no benefit. If the profile ever gains org-dependent fields, this
 * decision has to be revisited.
 */
export const authKeys = {
  all: ["auth"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
};
