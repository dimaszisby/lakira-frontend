"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAtom, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { fetchUserProfile } from "@/src/services/api/auth.api";
import type { UserAtom } from "@/src/services/state/atoms";
import { userAtom } from "@/src/services/state/atoms";

import { FullScreenSpinner } from "../ui/FullScreenSpinner";

export function withAuth<P extends object>(Wrapped: React.ComponentType<P>): React.FC<P> {
  const Guard: React.FC<P> = (props) => {
    const [user] = useAtom(userAtom);
    const setUser = useSetAtom(userAtom);
    const router = useRouter();
    const queryClient = useQueryClient();

    // local flag to avoid rendering while we decide/redirect
    const [checking, setChecking] = useState(true);

    // There is deliberately no `startedRef` guard here. One was added to stop
    // the bootstrapper running twice under StrictMode, and it deadlocked the
    // component against the cleanup it shares the effect with:
    //
    //   1. first pass runs, sets the ref, starts `bootstrap`
    //   2. StrictMode's cleanup sets that pass's `cancelled = true`
    //   3. second pass returns early on the ref, so nothing restarts
    //   4. the in-flight `bootstrap` reaches `finally`, sees `cancelled`, and
    //      skips `setChecking(false)`
    //
    // Nothing ever cleared `checking`, so `/account` showed its spinner
    // forever in `next dev`. Letting the effect re-run is the idiomatic fix:
    // each pass owns its own `cancelled`, so the second pass completes and the
    // first pass's late response is correctly ignored. The cost is one extra
    // profile fetch in development, which is exactly what StrictMode is for.
    useEffect(() => {
      let cancelled = false;

      const bootstrap = async () => {
        try {
          // prefer cache if available
          const cached = queryClient.getQueryData<UserAtom>(["userProfile"]);
          if (cached) {
            if (!cancelled) setUser(cached);
            return;
          }

          const data = await fetchUserProfile();

          if (!cancelled) {
            if (data) {
              setUser(data);
              queryClient.setQueryData(["userProfile"], data);
            } else {
              setUser(null);
              router.replace("/login");
            }
          }
        } catch {
          if (!cancelled) {
            setUser(null);
            router.replace("/login");
          }
        } finally {
          if (!cancelled) setChecking(false);
        }
      };

      void bootstrap();

      return () => {
        cancelled = true;
      };
    }, [queryClient, router, setUser]);

    // 1) Still deciding: show spinner (no child render yet)
    if (checking) return <FullScreenSpinner />;

    // 2) Redirecting (no user): render nothing to prevent further renders
    if (!user) return null;

    // 3) Authenticated: render page
    return <Wrapped {...props} />;
  };

  Guard.displayName = `withAuth(${Wrapped.displayName || Wrapped.name || "Component"})`;
  return Guard;
}
