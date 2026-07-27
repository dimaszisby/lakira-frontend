import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { authRoutes } from "@/lib/routes";
import AppShell from "@/src/components/layout/Layout";

const AppAreaLayout = async ({ children }: { children: ReactNode }) => {
  const token = (await cookies()).get("lakira_token");

  if (!token?.value) {
    redirect(authRoutes.login());
  }

  return <AppShell>{children}</AppShell>;
};

export default AppAreaLayout;
