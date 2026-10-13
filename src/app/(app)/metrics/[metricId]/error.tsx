"use client";

import { RouteErrorPanel } from "@/ui/RouteErrorPanel";

type MetricDetailErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

// The metric's layout stays above this boundary: breadcrumbs, the header card and the tabs. The
// heading keeps the level it had. That page has no h1 of its own today, which is a separate gap.
const MetricDetailError = ({ error, retry }: MetricDetailErrorProps) => (
  <RouteErrorPanel error={error} retry={retry} title="Unable to load metric" headingLevel={2} />
);

export default MetricDetailError;
