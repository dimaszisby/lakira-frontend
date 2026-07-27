"use client";

import { useCallback, useSyncExternalStore } from "react";

const defaultMatcher = (query: string) =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(query)
    : null;

/**
 * Subscribe to a media query and return whether it currently matches.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mq = defaultMatcher(query);
      if (!mq) return () => {};

      const listener = () => callback();

      if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", listener);
        return () => mq.removeEventListener("change", listener);
      }

      mq.addListener(listener);
      return () => mq.removeListener(listener);
    },
    [query],
  );

  const getSnapshot = useCallback(() => !!defaultMatcher(query)?.matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
