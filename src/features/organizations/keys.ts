/**
 * Cache keys for organization membership data.
 *
 * Org-scoped from the start, with the id at index 1 like every other factory —
 * see the note in `src/features/metrics/keys.ts`.
 */
export const organizationKeys = {
  all: (organizationId: string) => ["organizations", organizationId] as const,
  members: (organizationId: string) => [...organizationKeys.all(organizationId), "members"] as const,
};
