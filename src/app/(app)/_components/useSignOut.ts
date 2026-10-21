"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "react-hot-toast";

import { useLogoutUserMutation } from "@/features/auth/hooks/logout.mutation";
import { authRoutes } from "@/lib/routes";

/**
 * Signing out, wired once for the two places that offer it: the desktop sidebar, through
 * `AppShell`, and the account page, which is where a phone user signs out (kit `mobile-sign-out`,
 * D-01). Both render `SignOutControl` with what this returns.
 *
 * `Layout`, `Sidebar` and `SignOutControl` are `components` files and may not import a feature, so
 * the mutation lives here, in the `app` layer (kit `unquarantine-layout-files`, D-02).
 */
export const useSignOut = () => {
  const router = useRouter();

  // The feature hook, not a second inline mutation. The one this replaced
  // posted to the backend through the proxy and cleared nothing on this origin,
  // so "Logged out successfully" was followed by `/login` redirecting back to
  // the dashboard on a cookie that had never been removed.
  const { logoutUser, isPending } = useLogoutUserMutation(
    () => {
      toast.success("Logged out successfully");
      router.push(authRoutes.login());
    },
    (error) => {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    },
  );

  // `onClick` may not be async — see `no-misused-promises` in
  // `.claude/rules/code-style.md`. The rejection is swallowed here rather than
  // left floating: `onError` above is what reports a failure to the user, and
  // an uncaught `mutateAsync` rejection would surface as an unhandled promise.
  const signOut = useCallback(() => {
    logoutUser().catch(() => undefined);
  }, [logoutUser]);

  return { signOut, isSigningOut: isPending };
};
