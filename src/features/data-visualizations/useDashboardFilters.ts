"use client";

import { useAtom } from "jotai";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

import { dashboardRoute } from "@/lib/routes";

import {
  encodeDashboardFilters,
  isTimeRangeEqual,
  parseDashboardFilters,
} from "./dashboardFilters";
import { globalBucketAtom, globalRangeAtom } from "./state";
import type { BucketAlias, TimeRangeValue } from "./types";

export const useDashboardFilters = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [bucketAtom, setBucketAtom] = useAtom(globalBucketAtom);
  const [rangeAtom, setRangeAtom] = useAtom(globalRangeAtom);

  const parsed = useMemo(
    () =>
      parseDashboardFilters({
        bucket: searchParams.get("bucket"),
        range: searchParams.get("range"),
        rangeStart: searchParams.get("rangeStart"),
        rangeEnd: searchParams.get("rangeEnd"),
      }),
    [searchParams],
  );

  useEffect(() => {
    if (bucketAtom !== parsed.bucket) {
      setBucketAtom(parsed.bucket);
    }
    if (!isTimeRangeEqual(rangeAtom, parsed.range)) {
      setRangeAtom(parsed.range);
    }
  }, [bucketAtom, parsed.bucket, parsed.range, rangeAtom, setBucketAtom, setRangeAtom]);

  const commit = useCallback(
    (next: { bucket?: BucketAlias; range?: TimeRangeValue }) => {
      const nextBucket = next.bucket ?? parsed.bucket;
      const nextRange = next.range ?? parsed.range;

      setBucketAtom(nextBucket);
      setRangeAtom(nextRange);

      const params = encodeDashboardFilters({ bucket: nextBucket, range: nextRange });
      router.replace(dashboardRoute(params), { scroll: false });
    },
    [parsed.bucket, parsed.range, router, setBucketAtom, setRangeAtom],
  );

  return {
    bucket: parsed.bucket,
    range: parsed.range,
    setBucket: (bucket: BucketAlias) => commit({ bucket }),
    setRange: (range: TimeRangeValue) => commit({ range }),
  };
};
