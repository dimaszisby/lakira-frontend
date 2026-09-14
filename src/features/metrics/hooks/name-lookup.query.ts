import { useQuery } from "@tanstack/react-query";

import { useOrganizationId } from "@/features/organizations/context";

import { metricsKeys } from "../keys";
import { toMetricPreviewVM } from "../mappers";
import { getMetricLibraryViaCursor } from "../metric.api";
import type { MetricPreviewVM } from "../view-models";

/**
 * Metrics whose name resembles `name`, for the uniqueness check in `MetricForm`.
 *
 * ## Why this is not the offset list
 *
 * It used to be `useMetricsListViaOffset`, sending `page`, `limit`, `sortBy`,
 * `sortOrder` and `name`. `GET /metrics` moved to cursor pagination and
 * validates with a `.strict()` schema, so every one of those keys except
 * `limit` is now rejected:
 *
 *   Unrecognized key(s) in object: 'name', 'page', 'sortBy', 'sortOrder'
 *
 * The check therefore 400'd on every keystroke and silently never found a
 * duplicate — the form let conflicting names through. The offset endpoint is
 * gone from the backend router entirely; nothing else called it, so it went
 * with this change.
 *
 * ## Why a handful of candidates rather than one
 *
 * The backend applies `filter[name]` as a `LIKE`, not an equality
 * (`MetricReadRepoSequelize`). The old code asked for `limit: 1`, which even on
 * a working endpoint could return "Sleep Quality" while an exact "Sleep"
 * existed, and miss the conflict. The exact comparison stays on the caller,
 * which is case-insensitive and ignores the metric being edited.
 */

/** Enough to cover an exact match hiding behind similar prefixes. */
const NAME_LOOKUP_LIMIT = 10;

type NameLookupOptions = {
  enabled?: boolean;
  staleTime?: number;
};

export function useMetricNameLookup(name: string, opts: NameLookupOptions = {}) {
  const organizationId = useOrganizationId();
  const trimmed = name.trim();

  const { data, isLoading, isError } = useQuery({
    queryKey: metricsKeys.cursor.nameLookup(organizationId, trimmed),
    queryFn: () =>
      getMetricLibraryViaCursor({
        limit: NAME_LOOKUP_LIMIT,
        sort: "-createdAt",
        filter: { name: trimmed },
        includeTotal: false,
      }),
    select: (page): MetricPreviewVM[] => page.items.map(toMetricPreviewVM),
    enabled: (opts.enabled ?? true) && trimmed.length > 0,
    staleTime: opts.staleTime ?? 5_000,
  });

  return { candidates: data ?? [], isLoading, isError };
}
