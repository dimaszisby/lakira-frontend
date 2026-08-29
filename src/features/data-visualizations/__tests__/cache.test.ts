import { QueryClient } from "@tanstack/react-query";

import { invalidateMetricVisualization } from "../cache";
import { vizKeys } from "../keys";
import type { VizQuery } from "../types";

/**
 * `invalidateMetricVisualization` matches queries **by array position**, which
 * couples it to the exact shape of `vizKeys`. Adding the organization id shifted
 * every segment after index 0 by one.
 *
 * A positional predicate fails in the quiet direction: get the offsets wrong and
 * it matches nothing, so charts silently serve stale data with no error anywhere.
 * These tests are the only thing standing between that and a shipped bug.
 */

const ORG_A = "org-aaaaaaaa-0000-4000-8000-000000000001";
const ORG_B = "org-bbbbbbbb-0000-4000-8000-000000000002";
const QUERY: VizQuery = { last: "7d", bucket: "1d" };

const seed = (qc: QueryClient, organizationId: string, metricId: string) =>
  qc.setQueryData(vizKeys.byMetric(organizationId, metricId, QUERY), { seeded: true });

/** A query is "invalidated" when TanStack marks it stale. */
const isStale = (qc: QueryClient, organizationId: string, metricId: string) =>
  qc.getQueryState(vizKeys.byMetric(organizationId, metricId, QUERY))?.isInvalidated === true;

describe("invalidateMetricVisualization", () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => qc.clear());

  it("invalidates the target metric in the target organization", async () => {
    seed(qc, ORG_A, "m-1");
    await invalidateMetricVisualization(qc, ORG_A, "m-1");
    expect(isStale(qc, ORG_A, "m-1")).toBe(true);
  });

  it("leaves the same metric in another organization untouched", async () => {
    // The whole point of the org dimension. If the predicate ignored the org
    // segment, this would go stale too and refetch across a tenant boundary.
    seed(qc, ORG_A, "m-1");
    seed(qc, ORG_B, "m-1");

    await invalidateMetricVisualization(qc, ORG_A, "m-1");

    expect(isStale(qc, ORG_A, "m-1")).toBe(true);
    expect(isStale(qc, ORG_B, "m-1")).toBe(false);
  });

  it("leaves other metrics in the same organization untouched", async () => {
    seed(qc, ORG_A, "m-1");
    seed(qc, ORG_A, "m-2");

    await invalidateMetricVisualization(qc, ORG_A, "m-1");

    expect(isStale(qc, ORG_A, "m-1")).toBe(true);
    expect(isStale(qc, ORG_A, "m-2")).toBe(false);
  });

  it("does not touch dashboard keys, which share the resource root", async () => {
    qc.setQueryData(vizKeys.dashboard(ORG_A, QUERY), { seeded: true });
    seed(qc, ORG_A, "m-1");

    await invalidateMetricVisualization(qc, ORG_A, "m-1");

    expect(qc.getQueryState(vizKeys.dashboard(ORG_A, QUERY))?.isInvalidated).toBe(false);
  });

  it("matches nothing when the organization has no cached visualizations", async () => {
    seed(qc, ORG_A, "m-1");
    await expect(invalidateMetricVisualization(qc, ORG_B, "m-1")).resolves.not.toThrow();
    expect(isStale(qc, ORG_A, "m-1")).toBe(false);
  });
});
