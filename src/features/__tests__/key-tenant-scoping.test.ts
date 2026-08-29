import { authKeys } from "@/features/auth/keys";
import { vizKeys } from "@/features/data-visualizations/keys";
import type { VizQuery } from "@/features/data-visualizations/types";
import { metricCategoriesKeys } from "@/features/metric-categories/keys";
import { metricLogsKeys } from "@/features/metric-logs/keys";
import { metricSettingsKeys } from "@/features/metric-settings/keys";
import { metricsKeys } from "@/features/metrics/keys";

/**
 * Tenant isolation for every TanStack Query cache key.
 *
 * A key that does not carry the organization id will serve one tenant's cached
 * payload to another the moment a user belongs to two organizations. That is
 * not hypothetical: `lakira-backend` shipped the same defect and patched it
 * same-day as findings N1/N2, where its Redis keys were scoped by `userId`
 * alone.
 *
 * The existing integration suites cannot catch a regression here — they mock
 * the API layer and never seed a cache key — so this file is the only guard.
 */

const ORG_A = "org-aaaaaaaa-0000-4000-8000-000000000001";
const ORG_B = "org-bbbbbbbb-0000-4000-8000-000000000002";

const CURSOR = { limit: 20, sort: "-createdAt", page: 1 } as const;
const VIZ_QUERY: VizQuery = { last: "7d", bucket: "1d" };

/**
 * Every org-scoped key the app can build, as a pair of thunks that differ only
 * by organization. Adding a key factory method means adding it here.
 */
const scopedKeys: Array<{
  name: string;
  build: (organizationId: string) => readonly unknown[];
}> = [
  { name: "metrics.all", build: (o) => metricsKeys.all(o) },
  { name: "metrics.lists", build: (o) => metricsKeys.lists(o) },
  { name: "metrics.cursor.root", build: (o) => metricsKeys.cursor.root(o) },
  { name: "metrics.cursor.pages", build: (o) => metricsKeys.cursor.pages(o, CURSOR) },
  { name: "metrics.details", build: (o) => metricsKeys.details(o) },
  { name: "metrics.detail", build: (o) => metricsKeys.detail(o, "m-1") },
  { name: "metrics.detailByIdRoot", build: (o) => metricsKeys.detailByIdRoot(o, "m-1") },

  { name: "categories.all", build: (o) => metricCategoriesKeys.all(o) },
  { name: "categories.cursor.root", build: (o) => metricCategoriesKeys.cursor.root(o) },
  { name: "categories.cursor.pages", build: (o) => metricCategoriesKeys.cursor.pages(o, CURSOR) },
  { name: "categories.details", build: (o) => metricCategoriesKeys.details(o) },
  { name: "categories.detail", build: (o) => metricCategoriesKeys.detail(o, "c-1") },

  { name: "logs.all", build: (o) => metricLogsKeys.all(o) },
  { name: "logs.lists", build: (o) => metricLogsKeys.lists(o) },
  { name: "logs.cursor.root", build: (o) => metricLogsKeys.cursor.root(o) },
  { name: "logs.details", build: (o) => metricLogsKeys.details(o) },
  { name: "logs.detail", build: (o) => metricLogsKeys.detail(o, "l-1") },

  { name: "settings.all", build: (o) => metricSettingsKeys.all(o) },
  { name: "settings.lists", build: (o) => metricSettingsKeys.lists(o) },
  { name: "settings.cursor.root", build: (o) => metricSettingsKeys.cursor.root(o) },
  { name: "settings.details", build: (o) => metricSettingsKeys.details(o) },
  { name: "settings.detail", build: (o) => metricSettingsKeys.detail(o, "s-1") },

  { name: "viz.all", build: (o) => vizKeys.all(o) },
  { name: "viz.byMetric", build: (o) => vizKeys.byMetric(o, "m-1", VIZ_QUERY) },
  { name: "viz.dashboard", build: (o) => vizKeys.dashboard(o, VIZ_QUERY) },
];

describe("every org-scoped key differs across organizations", () => {
  it.each(scopedKeys.map(({ name, build }) => [name, build] as const))("%s", (_name, build) => {
    expect(build(ORG_A)).not.toEqual(build(ORG_B));
  });

  it.each(scopedKeys.map(({ name, build }) => [name, build] as const))(
    "%s contains the organization id",
    (_name, build) => {
      expect(build(ORG_A)).toContain(ORG_A);
    },
  );

  it.each(scopedKeys.map(({ name, build }) => [name, build] as const))(
    "%s is stable for the same organization",
    (_name, build) => {
      expect(build(ORG_A)).toEqual(build(ORG_A));
    },
  );
});

describe("key layout", () => {
  // The org id sits at index 1, after the resource root. cache.ts predicates
  // and every prefix invalidation depend on this; moving it breaks them
  // silently rather than loudly.
  it.each([
    ["metrics", metricsKeys.all(ORG_A), "metrics"],
    ["categories", metricCategoriesKeys.all(ORG_A), "categories"],
    ["logs", metricLogsKeys.all(ORG_A), "logs"],
    ["settings", metricSettingsKeys.all(ORG_A), "metric-settings"],
    ["viz", vizKeys.all(ORG_A), "viz"],
  ])("%s keys are [resource, organizationId, ...]", (_label, key, root) => {
    expect(key[0]).toBe(root);
    expect(key[1]).toBe(ORG_A);
  });

  it("keeps one org's keys from prefix-matching another's", () => {
    // How TanStack matches a partial key: element-wise from the left. If the
    // org id were at the tail, this prefix would match both organizations.
    const prefixA = metricsKeys.cursor.root(ORG_A);
    const keyB = metricsKeys.cursor.pages(ORG_B, CURSOR);

    const matches = prefixA.every((segment, index) => segment === keyB[index]);
    expect(matches).toBe(false);
  });
});

describe("authKeys stays user-scoped", () => {
  // Deliberate: the profile is a property of the user, identical whichever
  // organization the session acts for. See the comment in auth/keys.ts.
  it("carries no organization id", () => {
    expect(authKeys.all).toEqual(["auth"]);
    expect(authKeys.profile()).toEqual(["auth", "profile"]);
  });
});
