"use client";

import type { ReactNode } from "react";

import Layout from "@/components/layout/Layout";

import { useSignOut } from "./useSignOut";

interface AppShellProps {
  children: ReactNode;
}

/**
 * The signed-in shell with its sign-out wired in.
 *
 * `Layout` and `Sidebar` are `components` files and may not import a feature,
 * and `(app)/layout.tsx` is a Server Component and cannot pass a function. So
 * the sign-out is wired here, in the `app` layer, by `useSignOut`, and reaches
 * the sidebar as props (kit `unquarantine-layout-files`, D-02). The account
 * page uses the same hook (kit `mobile-sign-out`, D-01).
 */
const AppShell = ({ children }: AppShellProps) => {
  const { signOut, isSigningOut } = useSignOut();

  return (
    <Layout onLogout={signOut} isLoggingOut={isSigningOut}>
      {children}
    </Layout>
  );
};

export default AppShell;
