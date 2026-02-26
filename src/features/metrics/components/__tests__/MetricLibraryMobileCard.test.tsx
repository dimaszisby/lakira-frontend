import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MetricLibraryMobileCardBase } from "@/features/metrics/components/MetricLibraryMobileCard";
import type { MetricPreviewVM } from "@/features/metrics/view-models";

const mockPush = jest.fn();
const MUTED_ICON_LABEL_TEST_ID = "icon-label-muted";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/features/metric-categories/components/CategoryChip", () => ({
  __esModule: true,
  default: ({ category }: { category: { name: string } | null }) => (
    <span data-testid="category-chip">{category?.name ?? "No category"}</span>
  ),
}));

jest.mock("@/features/metric-categories/presenters/toCategoryUI", () => ({
  toCategoryUI: () => ({ id: "cat-ui", name: "Focus", color: "#fff", icon: "🔥" }),
}));

jest.mock("@/ui/IconLabel", () => ({
  __esModule: true,
  default: ({ label, tone }: { label: unknown; tone: string }) => (
    <span data-testid={`icon-label-${tone}`}>{String(label)}</span>
  ),
}));

const sampleMetric: MetricPreviewVM = {
  id: "metric-123",
  name: "Sleep Quality",
  defaultUnit: "hrs",
  description: "Daily sleep hours",
  isPublic: true,
  category: {
    id: "cat-1",
    name: "Wellness",
    color: "#000000",
    icon: "🌙",
  },
  goalType: null,
  logCount: 42,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
};

describe("MetricLibraryMobileCard", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("invokes onClick callback when provided", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<MetricLibraryMobileCardBase metric={sampleMetric} onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: /open metric sleep quality/i }));
    expect(onClick).toHaveBeenCalledWith(sampleMetric);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("pushes router route when no onClick", async () => {
    const user = userEvent.setup();
    render(<MetricLibraryMobileCardBase metric={sampleMetric} />);
    await user.click(screen.getByRole("button", { name: /open metric sleep quality/i }));
    expect(mockPush).toHaveBeenCalledWith("/metrics/metric-123");
  });

  it("renders metadata chips and labels", () => {
    render(<MetricLibraryMobileCardBase metric={sampleMetric} />);
    expect(screen.getByTestId("category-chip")).toHaveTextContent("Focus");
    const iconLabels = screen.getAllByTestId(MUTED_ICON_LABEL_TEST_ID).map((el) => el.textContent);
    expect(iconLabels).toEqual(expect.arrayContaining(["hrs", "Public", "42"]));
  });

  it("updates rendered content when metric fields change with same id", () => {
    const { rerender } = render(<MetricLibraryMobileCardBase metric={sampleMetric} />);
    expect(screen.getByText("Sleep Quality")).toBeInTheDocument();
    const initialLabels = screen.getAllByTestId(MUTED_ICON_LABEL_TEST_ID).map((el) => el.textContent);
    expect(initialLabels).toEqual(expect.arrayContaining(["hrs"]));

    rerender(
      <MetricLibraryMobileCardBase
        metric={{
          ...sampleMetric,
          name: "Sleep Score",
          defaultUnit: "points",
        }}
      />,
    );

    expect(screen.getByText("Sleep Score")).toBeInTheDocument();
    const iconLabels = screen.getAllByTestId(MUTED_ICON_LABEL_TEST_ID).map((el) => el.textContent);
    expect(iconLabels).toEqual(expect.arrayContaining(["points"]));
  });
});
