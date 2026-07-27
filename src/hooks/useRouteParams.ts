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
  const requiredKeys = options?.required ?? [];

  return useMemo(() => {
    const normalized: Record<string, string | undefined> = {};

    Object.entries(rawParams ?? {}).forEach(([key, value]) => {
      normalized[key] = normalizeValue(value);
    });

    requiredKeys.forEach((key) => {
      const castKey = String(key);
      if (!normalized[castKey]) {
        throw new Error(`Missing required route param: ${castKey}`);
      }
    });

    return normalized as T;
  }, [rawParams, requiredKeys]);
};
