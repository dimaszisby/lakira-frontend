"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAtom, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

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

    // prevent re-running the bootstrapper in StrictMode
    const startedRef = useRef(false);

    // local flag to avoid rendering while we decide/redirect
    const [checking, setChecking] = useState(true);

    useEffect(() => {
      if (startedRef.current) return;
      startedRef.current = true;

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
