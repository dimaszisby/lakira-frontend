"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

import { buildPath } from "@/lib/routes";
import type { QueryParams } from "@/lib/routes";

type RouteSyncOptions<T> = {
  serialize: (state: T) => QueryParams;
  buildHref?: (query: QueryParams) => string;
};

type RouteSyncHandler<T> = (next: T, options?: { method?: "replace" | "push"; scroll?: boolean }) => void;

/**
 * Normalizes the "sync component state to URL search params" pattern.
 * Provide a serialize function + optional custom href builder and receive a memoized updater.
 */
export const useRouteSync = <T>({
  serialize,
  buildHref,
}: RouteSyncOptions<T>): RouteSyncHandler<T> => {
  const router = useRouter();
  const pathname = usePathname();

  const resolveHref = useCallback(
    (query: QueryParams) => (buildHref ? buildHref(query) : buildPath(pathname, query)),
    [buildHref, pathname],
  );

  return useCallback(
    (next, options) => {
      const href = resolveHref(serialize(next));
      const navigate = options?.method === "push" ? router.push : router.replace;
      navigate(href, { scroll: options?.scroll ?? false });
    },
    [resolveHref, router, serialize],
  );
};
