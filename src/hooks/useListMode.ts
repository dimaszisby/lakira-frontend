"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export type ListMode = "pages" | "scroll";
export const LIST_MODE_DESKTOP_MQ = "(min-width: 1024px)"; // align with Tailwind `lg`
export function useListMode(storageKey = "metricCategoriesMode") {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const fromUrl = params?.get("mode");
  const urlMode = fromUrl === "pages" || fromUrl === "scroll" ? fromUrl : null;

  const [modeState, setModeState] = useState<ListMode>(() => {
    if (urlMode) return urlMode;
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(storageKey) as ListMode | null;
      if (saved === "pages" || saved === "scroll") return saved;
      return window.matchMedia(LIST_MODE_DESKTOP_MQ).matches ? "pages" : "scroll";
    }
    return "pages";
  });

  const mode = urlMode ?? modeState;

  const replaceParam = (m: ListMode) => {
    const sp = new URLSearchParams(params?.toString() || "");
    sp.set("mode", m);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, m);
    }
    setModeState(m);
  };

  return { mode, setMode: replaceParam, isPages: mode === "pages" };
}
