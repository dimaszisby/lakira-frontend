"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";

type UseRouteParamsOptions<T extends Record<string, string | undefined>> = {
  required?: Array<keyof T>;
};

const normalizeValue = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? undefined;
};

/**
 * Small helper that reads the current route params and ensures required keys exist.
 * This prevents repetitive casting sprinkled across client components.
 */
export const useRouteParams = <T extends Record<string, string | undefined>>(
  options?: UseRouteParamsOptions<T>,
): T => {
  const rawParams = useParams<Record<string, string | string[]>>();

  // Depend on the contents of `required`, not its identity. Both call sites pass
  // an inline literal — `useRouteParams({ required: ["categoryId"] })` — so the
  // array is a new object on every render and the memo never actually memoized:
  // it recomputed each time and handed back a fresh object. Joining to a
  // primitive is what makes the dependency stable.
  const requiredKey = (options?.required ?? []).map(String).join(",");

  return useMemo(() => {
    const normalized: Record<string, string | undefined> = {};

    Object.entries(rawParams ?? {}).forEach(([key, value]) => {
      normalized[key] = normalizeValue(value);
    });

    const requiredKeys = requiredKey ? requiredKey.split(",") : [];

    requiredKeys.forEach((castKey) => {
      if (!normalized[castKey]) {
        throw new Error(`Missing required route param: ${castKey}`);
      }
    });

    return normalized as T;
  }, [rawParams, requiredKey]);
};
