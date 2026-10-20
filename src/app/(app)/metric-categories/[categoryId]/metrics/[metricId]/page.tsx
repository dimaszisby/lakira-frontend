import CategoryMetricDialogRoute from "@/app/(app)/metric-categories/_components/CategoryMetricDialogRoute";

/**
 * Serves both "add a metric to this category" and "edit one of its metrics".
 *
 * Collapsed into one route for the same reason as
 * `metrics/[metricId]/logs/[logId]/page.tsx`: a parallel slot cannot hold two
 * interceptors that match the same segment. This slot had `(.)new` beside
 * `(.)[metricId]`, so Next built `…/metrics/(.)(.)new` and threw
 * `Invalid interception route`, falling back to a full page load on every click.
 *
 * This second occurrence was not reported by anyone — it was found by
 * `src/app/__tests__/parallel-route-interceptors.test.ts`, which is why that
 * test reads the directory tree rather than rendering anything.
 */
// Opened directly, the dialog is the whole page, so its title is the page's h1 (ADR-0032).
const CategoryMetricDialogPage = async ({ params }: { params: Promise<{ metricId: string }> }) => {
  const { metricId } = await params;
  return <CategoryMetricDialogRoute metricId={metricId} titleAs="h1" />;
};

export default CategoryMetricDialogPage;
