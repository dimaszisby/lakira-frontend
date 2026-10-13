"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback } from "react";
import { toast } from "react-hot-toast";

import Layout from "@/components/layout/Layout";
import { useLogoutUserMutation } from "@/features/auth/hooks/logout.mutation";
import { authRoutes } from "@/lib/routes";

interface AppShellProps {
  children: ReactNode;
}

/**
 * The signed-in shell with its sign-out wired in.
 *
 * `Layout` and `Sidebar` are `components` files and may not import a feature,
 * and `(app)/layout.tsx` is a Server Component and cannot pass a function. So
 * the mutation lives here, in the `app` layer, and reaches the sidebar as
 * props (kit `unquarantine-layout-files`, D-02).
 */
const AppShell = ({ children }: AppShellProps) => {
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
  const handleLogout = useCallback(() => {
    logoutUser().catch(() => undefined);
  }, [logoutUser]);

  return (
    <Layout onLogout={handleLogout} isLoggingOut={isPending}>
      {children}
    </Layout>
  );
};

export default AppShell;
