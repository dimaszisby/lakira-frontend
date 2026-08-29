import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { SESSION_COOKIE_NAME } from "@/constants/app";
import { OrganizationProvider } from "@/features/organizations/context";
import { decodeJwtPayload } from "@/lib/jwt";
import { authRoutes } from "@/lib/routes";
import AppShell from "@/src/components/layout/Layout";

const AppAreaLayout = async ({ children }: { children: ReactNode }) => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME);

  if (!token?.value) {
    redirect(authRoutes.login());
  }

  // The organization is a claim on the session token, so it is known here
  // without a round trip. Reading it server-side means every cache key is
  // tenant-scoped from the first render — a client-fetched value would arrive
  // after the first queries had already keyed themselves.
  //
  // The signature is not verified here; that needs the backend's secret, and
  // the backend re-checks on every proxied request. See src/lib/jwt.ts.
  const organizationId = decodeJwtPayload(token.value)?.organizationId;

  if (typeof organizationId !== "string" || organizationId.length === 0) {
    // A session without a tenant cannot be scoped safely. Send the user back
    // to login rather than rendering with an unscoped cache.
    redirect(authRoutes.login());
  }

  return (
    <OrganizationProvider organizationId={organizationId}>
      <AppShell>{children}</AppShell>
    </OrganizationProvider>
  );
};

export default AppAreaLayout;
