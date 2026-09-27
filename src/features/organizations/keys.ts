/**
 * Cache keys for organization membership data.
 *
 * Org-scoped from the start, with the id at index 1 like every other factory —
 * see the note in `src/features/metrics/keys.ts`.
 */
export const organizationKeys = {
  all: (organizationId: string) => ["organizations", organizationId] as const,
  members: (organizationId: string) =>
    [...organizationKeys.all(organizationId), "members"] as const,
  /**
   * The signed-in user's own organizations. The response is scoped to the user,
   * not to an organization, but the key still carries the active id so that
   * every factory here keeps the same tenant-first shape. A switch reloads the
   * page, so only one entry ever exists. See D-04 in the org-switcher kit.
   */
  mine: (organizationId: string) => [...organizationKeys.all(organizationId), "mine"] as const,
};
