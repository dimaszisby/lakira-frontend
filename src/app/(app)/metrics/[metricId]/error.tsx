"use client";

import { RouteErrorPanel } from "@/ui/RouteErrorPanel";

type MetricDetailErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

// The metric's layout stays above this boundary: breadcrumbs, the header card and the tabs. The
// header card holds the page's h1, the metric's name, so the panel's heading is an h2.
const MetricDetailError = ({ error, retry }: MetricDetailErrorProps) => (
  <RouteErrorPanel error={error} retry={retry} title="Unable to load metric" headingLevel={2} />
);

export default MetricDetailError;
