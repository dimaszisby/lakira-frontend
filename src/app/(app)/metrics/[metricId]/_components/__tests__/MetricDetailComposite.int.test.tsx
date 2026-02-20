import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Breadcrumbs from "@/app/(app)/metrics/[metricId]/_components/Breadcrumbs";
import { MetricDetailProvider } from "@/app/(app)/metrics/[metricId]/_components/MetricDetailContext";
import MetricDetailTabs from "@/app/(app)/metrics/[metricId]/_components/MetricDetailTabs";
import MetricHeaderSection from "@/app/(app)/metrics/[metricId]/_components/MetricHeaderSection";
import MetricSettingsSection from "@/app/(app)/metrics/[metricId]/_components/MetricSettingsSection";
import type { MetricSettingsExtendedVM } from "@/features/metric-settings/view-models";
import type { MetricHeaderVM } from "@/features/metrics/view-models";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const mockPush = jest.fn();
let mockPathname = "/metrics/metric-1";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

const metricId = "metric-1";
const fixedTimestamp = "2026-02-01T00:00:00.000Z";

const header: MetricHeaderVM = {
  id: metricId,
  name: "Body Weight",
  defaultUnit: "kg",
  description: "Weekly tracking metric",
  isPublic: false,
  category: {
    id: "cat-1",
    name: "Wellness",
    color: "#E897A3",
    icon: "🔥",
    metricCount: 3,
    createdAt: fixedTimestamp,
    updatedAt: fixedTimestamp,
  },
  createdAt: fixedTimestamp,
  updatedAt: "2026-02-05T00:00:00.000Z",
};

const settings: MetricSettingsExtendedVM = {
  id: "settings-1",
  metricId,
  isActive: true,
  goalEnabled: true,
  goalType: "incremental",
  goalValue: 75,
  timeFrameEnabled: true,
  startDate: "2026-02-01T00:00:00.000Z",
  deadlineDate: "2026-03-01T00:00:00.000Z",
  alertEnabled: true,
  alertThresholds: 80,
  isAchieved: false,
  displayOptions: {
    showOnDashboard: true,
    priority: 1,
    chartType: "line",
    color: "#E897A3",
  },
  createdAt: fixedTimestamp,
  updatedAt: "2026-02-05T00:00:00.000Z",
};

function renderMetricDetailComposite(initialPath: string) {
  mockPathname = initialPath;

  return renderWithProviders(
    <MetricDetailProvider value={{ metricId, header, settings }}>
      <Breadcrumbs />
      <MetricHeaderSection />
      <MetricDetailTabs />
      <MetricSettingsSection />
    </MetricDetailProvider>,
  );
}

describe("Metric detail composite integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockPathname = `/metrics/${metricId}`;
  });

  it("renders metric detail sections and marks the current tab active", async () => {
    renderMetricDetailComposite(`/metrics/${metricId}/logs`);

    expect(screen.getByRole("link", { name: /metric library/i })).toHaveAttribute("href", "/metrics");
    expect(screen.getByRole("link", { name: /wellness/i })).toHaveAttribute(
      "href",
      "/metric-categories/cat-1",
    );

    expect(screen.getAllByText("Body Weight").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Metric Settings")).toBeInTheDocument();
    expect(screen.getByText("Goal Settings")).toBeInTheDocument();
    expect(screen.getByText("Display Options")).toBeInTheDocument();

    const logsTab = screen.getByRole("link", { name: /^logs$/i });
    expect(logsTab).toHaveClass("bg-brand-primary/10");
    expect(logsTab).toHaveAttribute("href", `/metrics/${metricId}/logs`);
  });

  it("routes to edit screens from metric header and settings actions", async () => {
    const user = userEvent.setup();

    renderMetricDetailComposite(`/metrics/${metricId}`);

    await user.click(screen.getByRole("button", { name: /edit metric$/i }));
    expect(mockPush).toHaveBeenCalledWith(`/metrics/${metricId}/edit`);

    await user.click(screen.getByRole("button", { name: /edit metric settings/i }));
    expect(mockPush).toHaveBeenCalledWith(`/metrics/${metricId}/settings/edit`);
  });
});
