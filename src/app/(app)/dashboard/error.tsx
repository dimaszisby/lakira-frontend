"use client";

import { RouteErrorPanel } from "@/ui/RouteErrorPanel";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

// The dashboard's layout, and its h1, stay above this boundary, so the panel's heading is an h2.
const DashboardError = ({ error, retry }: DashboardErrorProps) => (
  <RouteErrorPanel
    error={error}
    retry={retry}
    title="Unable to load dashboard"
    headingLevel={2}
    className="mx-auto max-w-2xl"
  />
);

export default DashboardError;
