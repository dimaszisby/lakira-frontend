"use client";

import { RouteErrorPanel } from "@/ui/RouteErrorPanel";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

const DashboardError = ({ error, retry }: DashboardErrorProps) => (
  <RouteErrorPanel
    error={error}
    retry={retry}
    title="Unable to load dashboard"
    className="mx-auto max-w-2xl"
  />
);

export default DashboardError;
